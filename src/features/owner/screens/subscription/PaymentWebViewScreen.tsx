import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { View, Text, ActivityIndicator, Alert, StyleSheet, BackHandler, Linking, Platform, NativeModules, ActionSheetIOS, AppState } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '@/components/ScreenLayout';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SlideBottomModal } from '@/components/SlideBottomModal';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import { Theme } from '@/theme';
import { showErrorAlert } from '@/utils/errorHandler';
import { useCheckPaymentStatusMutation } from '@/features/owner/api/subscriptionApi';

const { UPIChooser } = NativeModules;

interface PaymentWebViewScreenProps {
  navigation: any;
  route: any;
}

/**
 * JavaScript injected into the WebView to intercept upi:// URLs at the JS level
 * BEFORE iOS WKWebView can open them natively.
 *
 * This overrides:
 * - window.location (href, assign, replace)
 * - HTMLAnchorElement href setter and click
 * - HTMLIFrameElement src setter
 * - window.open
 * - Element.click
 * - Form submission
 * - MutationObserver to catch dynamically added upi:// links
 *
 * When a upi:// URL is detected, it:
 * 1. Prevents the navigation from happening
 * 2. Sends the URL to React Native via postMessage
 * 3. RN shows the UPI app chooser
 */
const UPI_INTERCEPT_JS = `
(function() {
  if (window.__UPI_INTERCEPTOR_INSTALLED__) return;
  window.__UPI_INTERCEPTOR_INSTALLED__ = true;

  var UPI_SCHEMES = ['upi://', 'tez://', 'phonepe://', 'paytm://', 'paytmmp://', 'gpay://', 'credpay://', 'amazonpay://', 'payzapp://', 'mobikwik://', 'freecharge://', 'bhim://', 'whatsapp://'];
  var INTENT_RE = /^intent:\\/\\/.*scheme=(upi|tez|phonepe|paytm|gpay)/;

  function isUpiUrl(url) {
    if (!url || typeof url !== 'string') return false;
    for (var i = 0; i < UPI_SCHEMES.length; i++) {
      if (url.indexOf(UPI_SCHEMES[i]) === 0) return true;
    }
    return INTENT_RE.test(url);
  }

  function consumeAllowedUpiUrl(url, source) {
    if (!url || typeof url !== 'string') return false;
    if (window.__ALLOW_ONE_UPI_NAVIGATION__ && window.__ALLOW_ONE_UPI_NAVIGATION__ === url) {
      log('UPI_INTERCEPT: allowing one-time page-owned UPI navigation via ' + source + ' -> ' + url);
      window.__ALLOW_ONE_UPI_NAVIGATION__ = null;
      return true;
    }
    return false;
  }

  function sendToRN(type, data) {
    try {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({ type: type }, data)));
    } catch(e) {}
  }

  function sendUpiUrl(url) {
    sendToRN('upi_url', { url: url });
  }

  function log(msg) {
    sendToRN('debug_log', { msg: msg });
  }

  log('UPI_INTERCEPT: Starting installation...');

  // === 1. Try to override Location.prototype.href ===
  try {
    var locProto = window.Location && window.Location.prototype;
    var hrefDesc = locProto ? Object.getOwnPropertyDescriptor(locProto, 'href') : null;

    if (hrefDesc && hrefDesc.set) {
      var origHrefSet = hrefDesc.set;
      var origHrefGet = hrefDesc.get;
      Object.defineProperty(locProto, 'href', {
        get: function() { return origHrefGet.call(this); },
        set: function(url) {
          if (isUpiUrl(url)) {
            if (consumeAllowedUpiUrl(url, 'Location.href')) {
              origHrefSet.call(this, url);
              return;
            }
            sendUpiUrl(url);
            return;
          }
          origHrefSet.call(this, url);
        },
        configurable: true
      });
    } else {
      var locInstance = window.location;
      var instDesc = Object.getOwnPropertyDescriptor(locInstance, 'href');
    }
  } catch(e) { log('UPI_INTERCEPT: Location.href override FAILED: ' + e); }

  // === 2. Override Location.prototype.assign and replace ===
  try {
    var origAssign = window.location.assign.bind(window.location);
    var origReplace = window.location.replace.bind(window.location);
    window.Location.prototype.assign = function(url) {
      if (isUpiUrl(url)) {
        if (consumeAllowedUpiUrl(url, 'location.assign')) { origAssign(url); return; }
        sendUpiUrl(url);
        return;
      }
      origAssign(url);
    };
    window.Location.prototype.replace = function(url) {
      if (isUpiUrl(url)) {
        if (consumeAllowedUpiUrl(url, 'location.replace')) { origReplace(url); return; }
        sendUpiUrl(url);
        return;
      }
      origReplace(url);
    };
  } catch(e) { log('UPI_INTERCEPT: Location.assign/replace override FAILED: ' + e); }

  // === 3. Check window.location descriptor (info only) ===
  try {
    var windowLocDesc = Object.getOwnPropertyDescriptor(window, 'location');
  } catch(e) {}

  // === 4. Try to override document.location ===
  try {
    var origDocLoc = document.location;
    Object.defineProperty(document, 'location', {
      get: function() { return origDocLoc; },
      set: function(url) {
        if (isUpiUrl(url)) {
          if (consumeAllowedUpiUrl(url, 'document.location')) {
            origDocLoc.href = url;
            return;
          }
          sendUpiUrl(url);
          return;
        }
        origDocLoc.href = url;
      },
      configurable: true
    });
  } catch(e) {}

  // === 5. Override HTMLAnchorElement.href setter ===
  try {
    var anchorProto = HTMLAnchorElement.prototype;
    var aHrefDesc = Object.getOwnPropertyDescriptor(anchorProto, 'href');
    if (aHrefDesc && aHrefDesc.set) {
      var origAHrefSet = aHrefDesc.set;
      var origAHrefGet = aHrefDesc.get;
      Object.defineProperty(anchorProto, 'href', {
        get: function() { return origAHrefGet.call(this); },
        set: function(url) {
          if (isUpiUrl(url)) {
            this.setAttribute('data-upi-url', url);
            origAHrefSet.call(this, '#');
          } else {
            origAHrefSet.call(this, url);
          }
        },
        configurable: true
      });
    }
  } catch(e) {}

  // === 6. Override setAttribute to catch href="upi://..." ===
  try {
    var origSetAttr = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function(name, value) {
      if (name === 'href' && isUpiUrl(value)) {
        this.setAttribute('data-upi-url', value);
        return origSetAttr.call(this, 'href', '#');
      }
      return origSetAttr.apply(this, arguments);
    };
  } catch(e) {}

  // === 7. Override iframe src setter ===
  try {
    var iframeSrcDesc = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'src');
    if (iframeSrcDesc && iframeSrcDesc.set) {
      var origIframeSrcSet = iframeSrcDesc.set;
      Object.defineProperty(HTMLIFrameElement.prototype, 'src', {
        get: iframeSrcDesc.get,
        set: function(url) {
          if (isUpiUrl(url)) {
            sendUpiUrl(url);
            return;
          }
          origIframeSrcSet.call(this, url);
        },
        configurable: true
      });
    }
  } catch(e) {}

  // === 8. Override window.open ===
  try {
    var origOpen = window.open;
    window.open = function(url) {
      if (isUpiUrl(url)) {
        sendUpiUrl(url);
        return null;
      }
      return origOpen.apply(window, arguments);
    };
  } catch(e) {}

  // === 9. Override HTMLElement.click ===
  try {
    var origClick = HTMLElement.prototype.click;
    HTMLElement.prototype.click = function() {
      var upiUrl = this.getAttribute && this.getAttribute('data-upi-url');
      if (upiUrl) {
        sendUpiUrl(upiUrl);
        return;
      }
      if (this.tagName === 'A' && this.href && isUpiUrl(this.href)) {
        sendUpiUrl(this.href);
        return;
      }
      return origClick.apply(this, arguments);
    };
  } catch(e) {}

  // === 10. Override document.createElement to intercept iframe/anchor creation ===
  try {
    var origCreate = document.createElement;
    document.createElement = function(tag) {
      var el = origCreate.apply(document, arguments);
      if (tag && tag.toLowerCase() === 'iframe') {
        var origSrcSet = el.setAttribute;
        el.setAttribute = function(name, value) {
          if (name === 'src' && isUpiUrl(value)) {
            sendUpiUrl(value);
            return;
          }
          return origSrcSet.apply(this, arguments);
        };
      }
      return el;
    };
  } catch(e) {}

  // === 11. Override Node.appendChild to catch iframe additions ===
  try {
    var origAppend = Node.prototype.appendChild;
    Node.prototype.appendChild = function(child) {
      if (child && child.tagName === 'IFRAME' && child.src && isUpiUrl(child.src)) {
        sendUpiUrl(child.src);
        return child;
      }
      return origAppend.apply(this, arguments);
    };
  } catch(e) {}

  // === 12. visibilitychange listener (used by fallback completion flow) ===
  try {
    document.addEventListener('visibilitychange', function(e) {
      log('UPI_DEBUG: visibilitychange, hidden=' + document.hidden);
    });
    log('UPI_INTERCEPT: visibilitychange listener installed');
  } catch(e) { log('UPI_INTERCEPT: visibilitychange listener FAILED: ' + e); }

  // === 13. MutationObserver for dynamically added iframes and anchors ===
  try {
    var observer = new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var node = added[j];
          if (node.nodeType !== 1) continue;

          // Check if it's an iframe with upi:// src
          if (node.tagName === 'IFRAME' && node.src && isUpiUrl(node.src)) {
            log('UPI_INTERCEPT: MutationObserver found iframe with upi src: ' + node.src);
            sendUpiUrl(node.src);
            node.src = '';
            continue;
          }

          // Check if it's an anchor with upi:// href
          if (node.tagName === 'A' && node.getAttribute('href') && isUpiUrl(node.getAttribute('href'))) {
            var upiUrl = node.getAttribute('href');
            log('UPI_INTERCEPT: MutationObserver found anchor with upi href: ' + upiUrl);
            node.setAttribute('data-upi-url', upiUrl);
            node.setAttribute('href', '#');
          }

          // Check children
          if (node.querySelectorAll) {
            var iframes = node.querySelectorAll('iframe[src]');
            for (var k = 0; k < iframes.length; k++) {
              if (isUpiUrl(iframes[k].src)) {
                log('UPI_INTERCEPT: MutationObserver found child iframe with upi src: ' + iframes[k].src);
                sendUpiUrl(iframes[k].src);
                iframes[k].src = '';
              }
            }
            var links = node.querySelectorAll('a[href]');
            for (var k = 0; k < links.length; k++) {
              var href = links[k].getAttribute('href');
              if (href && isUpiUrl(href)) {
                log('UPI_INTERCEPT: MutationObserver found child anchor with upi href: ' + href);
                links[k].setAttribute('data-upi-url', href);
                links[k].setAttribute('href', '#');
              }
            }
          }
        }
      }
    });
    observer.observe(document.documentElement || document, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'href'] });
  } catch(e) {}

  // === 14. Periodic DOM scan for upi:// URLs (safety net for MutationObserver) ===
  setInterval(function() {
    try {
      var iframes = document.querySelectorAll('iframe[src]');
      for (var i = 0; i < iframes.length; i++) {
        if (isUpiUrl(iframes[i].src)) {
          sendUpiUrl(iframes[i].src);
          iframes[i].src = '';
        }
      }
      var anchors = document.querySelectorAll('a[href]');
      for (var i = 0; i < anchors.length; i++) {
        var href = anchors[i].getAttribute('href');
        if (href && isUpiUrl(href) && !anchors[i].getAttribute('data-upi-url')) {
          anchors[i].setAttribute('data-upi-url', href);
          anchors[i].setAttribute('href', '#');
        }
      }
    } catch(e) {}
  }, 1000);

  // === 15. Intercept CCAvenue "Pay By Any UPI App" before their native launch ===
  // Instead of letting the hosted page auto-launch a default UPI app, we show our
  // own chooser in React Native. Once the user picks an app, RN calls back into
  // window.__CCAV_REQUEST_UPI_APP_LINK(appKey), which fetches the exact app-specific
  // deeplink from CCAvenue's own getPaymentLink flow.
  //
  // This interception runs on BOTH iOS and Android. On Android, CCAvenue's own
  // UPI launch often fails or opens the wrong app, so we intercept here too and
  // show our own chooser.
  var ccavOtherUpiBusy = false;

  function closestOtherUpiLink(target) {
    var el = target;
    while (el && el !== document) {
      if (el.matches && (el.matches('a.otherupi') || el.matches('.btn-payby-any-upi-app.otherupi') || el.matches('.otherupi-icon-m'))) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  function formUrlEncoded(form) {
    var fd = new FormData(form);
    return new URLSearchParams(fd).toString();
  }

  function safeJsonParse(text) {
    try { return JSON.parse(text); } catch (e) { return null; }
  }

  function postForm(path, body) {
    return fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'include',
      body: body,
    }).then(function(res) { return res.text(); });
  }

  function ccavRedirectToMerchant(reason) {
    try {
      var form = document.getElementById('TransactionForm');
      var commandEl = document.getElementById('command');
      if (!form || !commandEl) {
        log('CCAV FALLBACK: redirectToMerchant skipped, missing form/command for ' + reason);
        return;
      }
      commandEl.value = 'redirectToMerchant';
      form.setAttribute('action', '/redirectToMerchant');
      form.setAttribute('target', '_parent');
      log('CCAV FALLBACK: submitting redirectToMerchant (' + reason + ')');
      form.submit();
    } catch (err) {
      log('CCAV FALLBACK: redirectToMerchant exception: ' + err);
    }
  }

  function ccavStartFallbackCompletion(context) {
    try {
      if (window.__CCAV_UPI_COMPLETION_STARTED__) {
        log('CCAV FALLBACK: completion already started for ' + context.appKey);
        return;
      }
      window.__CCAV_UPI_COMPLETION_STARTED__ = true;

      try {
        if (window.__CCAV_UPI_POLL_INTERVAL__) {
          window.clearInterval(window.__CCAV_UPI_POLL_INTERVAL__);
        }
      } catch (e) {}

      var retrySeconds = parseInt(String(context.retryWindow || ''), 10);
      if (!retrySeconds || retrySeconds <= 0) retrySeconds = 240;
      var remaining = retrySeconds;
      var authQuerySent = false;
      var hiddenAt = Date.now();
      var appReturnedAt = 0;
      var repollCountAfterReturn = 0;
      var earlyRedirectTriggered = false;
      var noActionTimeoutMs = 120000;
      var noActionRedirected = false;

      if (window.__CCAV_RETURNED_VISIBLE_LISTENER__) {
        document.removeEventListener('visibilitychange', window.__CCAV_RETURNED_VISIBLE_LISTENER__, false);
      }
      window.__CCAV_RETURNED_VISIBLE_LISTENER__ = function() {
        if (document.visibilityState === 'visible' && !appReturnedAt) {
          appReturnedAt = Date.now();
          window.__CCAV_FORCE_AUTH_QUERY__ = true;
          log('CCAV FALLBACK: page visible again, forcing auth-status query on next poll');
        }
      };
      document.addEventListener('visibilitychange', window.__CCAV_RETURNED_VISIBLE_LISTENER__, false);

      var runPoll = function() {
        var trackingIdEl = document.getElementById('trackingId');
        if (!trackingIdEl) {
          log('CCAV FALLBACK: poll skipped, trackingId missing');
          return;
        }

        var shouldForceAuthQuery = !!window.__CCAV_FORCE_AUTH_QUERY__;
        var callAuthStatusQuery = (shouldForceAuthQuery || (remaining <= 20 && !authQuerySent)) ? 'Y' : 'N';
        if (callAuthStatusQuery === 'Y') {
          authQuerySent = true;
          window.__CCAV_FORCE_AUTH_QUERY__ = false;
        }

        var pollBody = new URLSearchParams();
        pollBody.append('command', 'pollOrderStatusForUPI');
        pollBody.append('trackingId', trackingIdEl.value || '');
        pollBody.append('callAuthStatusQuery', callAuthStatusQuery);

        postForm('/transaction.do', pollBody.toString())
          .then(function(text) {
            var json = safeJsonParse(text);
            var data = json && typeof json === 'object' && 'data' in json ? String(json.data || '') : String(text || '');
            log('CCAV FALLBACK: pollOrderStatusForUPI -> ' + data + ' remaining=' + remaining);

            var status = data.split('$')[0] || '';
            var statusFlag = data.split('$')[1] || '';

            if (status === 'REPOLL' || status === '') {
              if (appReturnedAt) {
                repollCountAfterReturn += 1;
              }
              remaining -= 3;

              if (!earlyRedirectTriggered && appReturnedAt && repollCountAfterReturn >= 2) {
                earlyRedirectTriggered = true;
                try { window.clearInterval(window.__CCAV_UPI_POLL_INTERVAL__); } catch (e) {}
                window.__CCAV_UPI_POLL_INTERVAL__ = null;
                log('CCAV FALLBACK: REPOLL persisted after app return, forcing early redirectToMerchant');
                ccavRedirectToMerchant('fallback-early-repoll-after-return');
                return;
              }

              if (!noActionRedirected && !appReturnedAt && (Date.now() - hiddenAt) >= noActionTimeoutMs) {
                noActionRedirected = true;
                try { window.clearInterval(window.__CCAV_UPI_POLL_INTERVAL__); } catch (e) {}
                window.__CCAV_UPI_POLL_INTERVAL__ = null;
                log('CCAV FALLBACK: user did not return for ' + noActionTimeoutMs + 'ms, forcing redirectToMerchant');
                ccavRedirectToMerchant('fallback-no-action-timeout');
                return;
              }

              if (remaining <= 0) {
                try { window.clearInterval(window.__CCAV_UPI_POLL_INTERVAL__); } catch (e) {}
                window.__CCAV_UPI_POLL_INTERVAL__ = null;
                ccavRedirectToMerchant('fallback-timeout');
              }
              return;
            }

            try { window.clearInterval(window.__CCAV_UPI_POLL_INTERVAL__); } catch (e) {}
            window.__CCAV_UPI_POLL_INTERVAL__ = null;
            if (window.__CCAV_RETURNED_VISIBLE_LISTENER__) {
              document.removeEventListener('visibilitychange', window.__CCAV_RETURNED_VISIBLE_LISTENER__, false);
              window.__CCAV_RETURNED_VISIBLE_LISTENER__ = null;
            }

            if (status === 'Aborted' && statusFlag === 'true') {
              log('CCAV FALLBACK: aborted=true received, redirecting to merchant for cancel');
              ccavRedirectToMerchant('fallback-aborted-true');
              return;
            }

            if (status === 'Pending') {
              var isMandateEl = document.getElementById('isMandate');
              if (isMandateEl) isMandateEl.value = 'Y';
            }

            ccavRedirectToMerchant('fallback-status-' + status + (statusFlag ? '-' + statusFlag : ''));
          })
          .catch(function(err) {
            remaining -= 3;
            log('CCAV FALLBACK: pollOrderStatusForUPI error: ' + err + ' remaining=' + remaining);
            if (remaining <= 0) {
              try { window.clearInterval(window.__CCAV_UPI_POLL_INTERVAL__); } catch (e) {}
              window.__CCAV_UPI_POLL_INTERVAL__ = null;
              ccavRedirectToMerchant('fallback-poll-error-timeout');
            }
          });
      };

      log('CCAV FALLBACK: starting fallback completion for ' + context.appKey + ' retry=' + retrySeconds + ' appMid=' + (context.appMid || '') + ' gateway=' + (context.gatewayId || ''));
      runPoll();
      window.__CCAV_UPI_POLL_INTERVAL__ = window.setInterval(runPoll, 3000);
    } catch (err) {
      log('CCAV FALLBACK: start completion exception: ' + err);
    }
  }

  window.__CCAV_PREPARE_UPI_COMPLETION = function(appKey, retryWindow, gatewayId) {
    try {
      var deepLinkEl = document.getElementById('deepLink');
      var appMidEl = document.getElementById('appMid');
      var normalizedAppMid = appMidEl && appMidEl.value ? appMidEl.value : '';

      if (normalizedAppMid === 'B,B') normalizedAppMid = 'B';
      if (normalizedAppMid === 'I,I') normalizedAppMid = 'I';
      if (deepLinkEl) deepLinkEl.value = appKey;

      var context = {
        appKey: appKey,
        retryWindow: retryWindow || '',
        gatewayId: gatewayId || '',
        appMid: normalizedAppMid
      };

      window.__CCAV_PENDING_UPI_CONTEXT__ = context;

      if (window.__CCAV_VISIBILITY_LISTENER__) {
        document.removeEventListener('visibilitychange', window.__CCAV_VISIBILITY_LISTENER__, false);
      }

      window.__CCAV_VISIBILITY_LISTENER__ = function() {
        if (document.visibilityState === 'hidden') {
          document.removeEventListener('visibilitychange', window.__CCAV_VISIBILITY_LISTENER__, false);
          log('CCAV FALLBACK: visibility hidden for ' + appKey + ', starting completion flow');
          ccavStartFallbackCompletion(context);
        }
      };

      document.addEventListener('visibilitychange', window.__CCAV_VISIBILITY_LISTENER__, false);
      log('CCAV FALLBACK: registered visibility listener for ' + appKey + ' appMid=' + normalizedAppMid + ' gateway=' + (gatewayId || ''));
    } catch (err) {
      log('CCAV APP LINK: prepare completion exception: ' + err);
    }
  };

  window.__CCAV_OPEN_EXACT_APP_LINK = function(url) {
    try {
      if (!url || typeof url !== 'string') {
        log('CCAV APP LINK: cannot launch empty exact app link');
        return;
      }
      window.__ALLOW_ONE_UPI_NAVIGATION__ = url;
      log('CCAV APP LINK: launching exact app link from page context -> ' + url);
      try {
        window.location.href = url;
      } catch (e1) {
        try {
          window.location.assign(url);
        } catch (e2) {
          document.location = url;
        }
      }
    } catch (err) {
      log('CCAV APP LINK: page launch exception: ' + err);
    }
  };

  window.__CCAV_REQUEST_UPI_APP_LINK = function(appKey) {
    try {
      log('CCAV APP LINK: requesting exact deeplink for ' + appKey);
      var form = document.getElementById('TransactionForm');
      if (!form) {
        log('CCAV APP LINK: TransactionForm not found');
        return;
      }

      var deepLinkEl = document.getElementById('deepLink');
      var cardNameEl = document.getElementById('cardName');
      var cardTypeEl = document.getElementById('orderCardType');
      var commandEl = document.getElementById('command');
      var upiAppEl = document.getElementById('upiApp');
      var upiqrEl = document.getElementById('UPIQR');

      if (deepLinkEl) deepLinkEl.value = appKey;
      if (cardNameEl) cardNameEl.value = 'UPI';
      if (cardTypeEl) cardTypeEl.value = 'UPI';
      if (commandEl) commandEl.value = 'getPaymentLink';
      if (upiAppEl) upiAppEl.value = appKey;
      if (upiqrEl) upiqrEl.value = '';
      window.__CCAV_UPI_COMPLETION_STARTED__ = false;
      window.__CCAV_FORCE_AUTH_QUERY__ = false;
      if (window.__CCAV_VISIBILITY_LISTENER__) {
        document.removeEventListener('visibilitychange', window.__CCAV_VISIBILITY_LISTENER__, false);
      }
      if (window.__CCAV_RETURNED_VISIBLE_LISTENER__) {
        document.removeEventListener('visibilitychange', window.__CCAV_RETURNED_VISIBLE_LISTENER__, false);
        window.__CCAV_RETURNED_VISIBLE_LISTENER__ = null;
      }
      if (window.__CCAV_UPI_POLL_INTERVAL__) {
        window.clearInterval(window.__CCAV_UPI_POLL_INTERVAL__);
        window.__CCAV_UPI_POLL_INTERVAL__ = null;
      }

      var body = formUrlEncoded(form);
      postForm('/transaction.do', body)
        .then(function(text) {
          var json = safeJsonParse(text);
          var dataString = json && typeof json === 'object' && 'data' in json ? String(json.data || '') : String(text || '');
          log('CCAV APP LINK: getPaymentLink response=' + dataString);
          var parts = dataString.split('|');
          var link = parts[0] || '';
          var status = parts[1] || '';
          var retryWindow = parts[3] || '';
          var gatewayId = parts[4] || '';
          if (status === '0' && link && link.indexOf('://') > 0) {
            try {
              if (typeof window.La !== 'undefined') window.La = link;
              if (typeof window.za !== 'undefined') window.za = retryWindow;
              if (typeof window.Qa !== 'undefined') window.Qa = gatewayId;
            } catch (e) {}
            window.__CCAV_PREPARE_UPI_COMPLETION(appKey, retryWindow, gatewayId);
            sendToRN('ccav_app_link', { appKey: appKey, url: link });
          } else {
            log('CCAV APP LINK: invalid deeplink response for ' + appKey);
          }
        })
        .catch(function(err) {
          log('CCAV APP LINK: getPaymentLink error: ' + err);
        });
    } catch (err) {
      log('CCAV APP LINK: exception: ' + err);
    }
  };

  document.addEventListener('click', function(e) {
    var link = closestOtherUpiLink(e.target);
    if (!link) {
      return;
    }

    // Intercept "Pay By Any UPI App" on BOTH iOS and Android.
    // We show our own UPI app chooser in React Native instead of letting
    // CCAvenue's JS auto-launch a default UPI app (which often fails or
    // opens the wrong app on Android).
    log('CCAV OTHERUPI: intercepting Pay By Any UPI App');
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();

    if (ccavOtherUpiBusy) {
      return false;
    }

    ccavOtherUpiBusy = true;
    sendToRN('ccav_choose_upi_app', {});
    window.setTimeout(function() {
      ccavOtherUpiBusy = false;
    }, 800);

    return false;
  }, true);

  // === 16. Click logger (capture phase) - debug only, removed for production ===
  // === 17. Intercept jQuery-style event binding ===
  try {
    var origAddEvt = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, useCapture) {
      if (type === 'click') {
        var self = this;
        var origListener = listener;
        var wrappedListener = function(e) {
          var el = self;
          var upiUrl = null;
          while (el && !upiUrl) {
            if (el.getAttribute && el.getAttribute('data-upi-url')) {
              upiUrl = el.getAttribute('data-upi-url');
            }
            el = el.parentElement;
          }
          if (upiUrl) {
            log('UPI_INTERCEPT: Blocked addEventListener click for UPI: ' + upiUrl);
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            sendUpiUrl(upiUrl);
            return false;
          }
          return origListener.apply(this, arguments);
        };
        return origAddEvt.call(this, type, wrappedListener, useCapture);
      }
      return origAddEvt.call(this, type, listener, useCapture);
    };
  } catch(e) {}

  log('UPI_INTERCEPT: All interceptors installed');
})();
`;

/**
 * CCAvenue requires a POST form submission with encRequest and access_code
 * as form fields. Loading the payment URL directly (GET) results in a blank page.
 */
const buildPaymentFormHtml = (paymentUrl: string): string => {
  try {
    const urlObj = new URL(paymentUrl);
    const encVal = urlObj.searchParams.get('enc_val') || urlObj.searchParams.get('encRequest') || '';
    const accessCode = urlObj.searchParams.get('access_code') || '';
    const actionParams = new URLSearchParams(urlObj.search);
    actionParams.delete('enc_val');
    actionParams.delete('encRequest');
    actionParams.delete('access_code');
    const actionQuery = actionParams.toString();
    const actionUrl = `${urlObj.origin}${urlObj.pathname}${actionQuery ? '?' + actionQuery : ''}`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
    .loader { text-align: center; }
    .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3B82F6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    p { color: #666; }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <p>Redirecting to payment gateway...</p>
  </div>
  <form id="paymentForm" method="POST" action="${actionUrl}">
    <input type="hidden" name="encRequest" value="${encVal}">
    <input type="hidden" name="access_code" value="${accessCode}">
  </form>
  <script>
    document.getElementById('paymentForm').submit();
  </script>
</body>
</html>
    `;
  } catch (e) {
    console.error('Failed to parse payment URL:', e);
    return '';
  }
};

const PAYMENT_SCHEMES = [
  'upi://', 'tez://', 'phonepe://', 'paytm://', 'paytmmp://',
  'gpay://', 'credpay://', 'amazonpay://', 'payzapp://',
  'mipay://', 'freecharge://', 'airtelmoney://', 'mobikwik://',
  'olamoney://', 'jiomoney://',
];

const isPaymentUrl = (url: string): boolean => {
  const isPaymentDeepLink = PAYMENT_SCHEMES.some(scheme => url.startsWith(scheme));
  const isPaymentIntent = url.startsWith('intent://') &&
    (url.includes('scheme=upi') || url.includes('scheme=tez') ||
     url.includes('scheme=phonepe') || url.includes('scheme=paytm') ||
     url.includes('scheme=gpay'));
  return isPaymentDeepLink || isPaymentIntent;
};

const parseIntentUrl = (url: string): { scheme: string; constructedUrl: string; fallbackUrl?: string } | null => {
  const intentMatch = url.match(/intent:\/\/([^#]*)#Intent;(.*);end$/i);
  if (!intentMatch) return null;
  const path = intentMatch[1];
  const params = intentMatch[2].split(';').reduce((acc, pair) => {
    const [key, value] = pair.split('=');
    if (key && value) acc[key] = decodeURIComponent(value);
    return acc;
  }, {} as Record<string, string>);
  const scheme = params.scheme || 'upi';
  const fallbackUrl = params['S.browser_fallback_url'];
  const constructedUrl = `${scheme}://${path}`;
  return { scheme, constructedUrl, fallbackUrl };
};

// UPI apps for iOS ActionSheet chooser.
// For CCAvenue hosted UPI flow we should request the exact app-specific link from
// the page itself using upiApp keys, instead of rewriting a generic upi:// URL.
// UPI apps for iOS ActionSheet chooser.
// For CCAvenue hosted UPI flow we should request the exact app-specific link from
// the page itself using upiApp keys, instead of rewriting a generic upi:// URL.
const UPI_APPS_IOS: { name: string; appKey: string; icon: string }[] = [
  { name: 'GPay', appKey: 'googlepay', icon: 'logo-google' },
  { name: 'PhonePe', appKey: 'phonepe', icon: 'phone-portrait-outline' },
  { name: 'Paytm', appKey: 'paytm', icon: 'wallet-outline' },
  { name: 'BHIM', appKey: 'bhim', icon: 'card-outline' },
  { name: 'CRED', appKey: 'cred', icon: 'card-outline' },
  { name: 'Any UPI App', appKey: 'upi', icon: 'apps-outline' },
];

// Android UPI apps — same appKey values as iOS so CCAvenue's getPaymentLink
// returns the correct app-specific deeplink for each platform.
const UPI_APPS_ANDROID: { name: string; appKey: string; icon: string }[] = [
  { name: 'GPay', appKey: 'googlepay', icon: 'logo-google' },
  { name: 'PhonePe', appKey: 'phonepe', icon: 'phone-portrait-outline' },
  { name: 'Paytm', appKey: 'paytm', icon: 'wallet-outline' },
  { name: 'BHIM', appKey: 'bhim', icon: 'card-outline' },
  { name: 'CRED', appKey: 'cred', icon: 'card-outline' },
  { name: 'Amazon Pay', appKey: 'amazonpay', icon: 'cart-outline' },
  { name: 'Any UPI App', appKey: 'upi', icon: 'apps-outline' },
];

const PAYMENT_CALLBACK_PATH = '/subscription/payment/callback';
const PAYMENT_CANCEL_PATH = '/subscription/payment/cancel';
const PAYMENT_STATUS_POLL_INTERVAL_MS = 2000;
const PAYMENT_STATUS_MAX_WAIT_MS = 20 * 60 * 1000;

export const PaymentWebViewScreen: React.FC<PaymentWebViewScreenProps> = ({ navigation, route }) => {
  const { paymentUrl, orderId } = route.params;
  const [loading, setLoading] = useState(true);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('Waiting for payment confirmation...');
  const [checkPaymentStatus] = useCheckPaymentStatusMutation();
  const paymentFormHtml = useMemo(() => buildPaymentFormHtml(paymentUrl), [paymentUrl]);
  const openedPaymentUrlsRef = useRef<Set<string>>(new Set());
  const webViewRef = useRef<any>(null);
  const paymentVerificationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const paymentVerificationStartedRef = useRef(false);
  const paymentStatusHandledRef = useRef(false);
  const paymentFlowStartedAtRef = useRef<number | null>(null);
  const paymentPendingAlertShownRef = useRef(false);
  const paymentCallbackSeenRef = useRef(false);
  const startPaymentStatusPollingRef = useRef<() => void>(() => undefined);
  const appStateRef = useRef(AppState.currentState);
  const allowedPageLaunchUrlRef = useRef<string | null>(null);

  // Android UPI app chooser bottom sheet state
  const [upiChooserVisible, setUpiChooserVisible] = useState(false);
  const upiChooserUrlRef = useRef<string>('');

  const resetPaymentTracking = useCallback(() => {
    paymentVerificationStartedRef.current = false;
    paymentFlowStartedAtRef.current = null;
    paymentPendingAlertShownRef.current = false;
    paymentCallbackSeenRef.current = false;
    openedPaymentUrlsRef.current.clear();
    setVerificationMessage('Waiting for payment confirmation...');
  }, []);

  // Full reset including the "handled" flag — only used when starting a fresh
  // payment flow or navigating away, NOT from handlePaymentOutcome (which needs
  // the flag to stay true to prevent duplicate alerts).
  const fullResetPaymentTracking = useCallback(() => {
    resetPaymentTracking();
    paymentStatusHandledRef.current = false;
  }, [resetPaymentTracking]);

  const markPaymentFlowStarted = useCallback((message?: string) => {
    paymentVerificationStartedRef.current = true;
    if (!paymentFlowStartedAtRef.current) {
      paymentFlowStartedAtRef.current = Date.now();
    }
    const defaultMessage = paymentCallbackSeenRef.current
      ? 'Finalizing payment...'
      : 'Waiting for payment confirmation...';
    setVerificationMessage(message || defaultMessage);
    setVerifyingPayment(true);
  }, []);

  const normalizePaymentOutcome = useCallback((status: string | null | undefined) => {
    const normalized = String(status || '').trim().toLowerCase();
    if (!normalized) return '';
    if (['success', 'successful', 'completed', 'paid'].includes(normalized)) return 'Success';
    if (['aborted', 'cancelled', 'canceled', 'cancel'].includes(normalized)) return 'Aborted';
    if (['failure', 'failed', 'error'].includes(normalized)) return 'Failure';
    return '';
  }, []);

  const handleUpiAppSelection = useCallback(async (upiUrl: string, app: { name: string; appKey: string }) => {
    const isCcavChooser = upiUrl === 'ccavenues://chooser' || upiUrl.includes('ccavenues%40icici');

    // For CCAvenue-hosted UPI flows, ask the page JS to fetch the exact
    // app-specific deeplink via getPaymentLink instead of rewriting the URL.
    if (webViewRef.current && isCcavChooser) {
      console.log('💳 Requesting CCAvenue app link:', app.appKey);
      webViewRef.current.injectJavaScript(
        `window.__CCAV_REQUEST_UPI_APP_LINK && window.__CCAV_REQUEST_UPI_APP_LINK(${JSON.stringify(app.appKey)}); true;`,
      );
      return;
    }

    // Fallback for generic non-CCAvenue upi:// links.
    const urlPath = upiUrl.replace(/^upi:\/\/pay\?/, '');
    const prefixMap: Record<string, string> = {
      googlepay: 'tez://upi/pay?',
      phonepe: 'phonepe://pay?',
      paytm: 'paytmmp://pay?',
      bhim: 'bhim://upi/pay?',
      cred: 'credpay://upi/pay?',
      amazonpay: 'upi://pay?',
      upi: 'upi://pay?',
    };
    const appUrl = `${prefixMap[app.appKey] || 'upi://pay?'}${urlPath}`;
    console.log('💳 Opening UPI app:', app.name, appUrl);
    try {
      startPaymentStatusPollingRef.current();
      await Linking.openURL(appUrl);
    } catch (err) {
      console.error('💳 Failed to open', app.name, ':', err);
      Alert.alert(
        `${app.name} Not Installed`,
        `Please install ${app.name} from the ${Platform.OS === 'ios' ? 'App Store' : 'Play Store'} to use this payment method.`,
        [{ text: 'OK' }],
      );
    }
  }, []);

  const showUpiAppChooser = useCallback(async (upiUrl: string) => {
    console.log('💳 showUpiAppChooser', { platform: Platform.OS, upiUrl });

    const apps = Platform.OS === 'ios' ? UPI_APPS_IOS : UPI_APPS_ANDROID;

    if (Platform.OS === 'ios') {
      const options = apps.map(app => app.name);
      options.push('Cancel');

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          title: 'Pay with UPI App',
          message: 'Select a UPI app to complete your payment',
        },
        async (buttonIndex: number) => {
          if (buttonIndex === options.length - 1) return;
          const app = apps[buttonIndex];
          await handleUpiAppSelection(upiUrl, app);
        },
      );
    } else {
      // Android: show a proper bottom sheet modal with all UPI apps listed.
      upiChooserUrlRef.current = upiUrl;
      setUpiChooserVisible(true);
    }
  }, [handleUpiAppSelection]);

  const openExternalPaymentUrl = useCallback(async (url: string) => {
    if (openedPaymentUrlsRef.current.has(url)) return;
    openedPaymentUrlsRef.current.add(url);

    if (url.startsWith('intent://')) {
      try {
        const parsed = parseIntentUrl(url);
        if (!parsed) return;
        const { scheme, constructedUrl } = parsed;

        if (Platform.OS === 'android' && (scheme === 'upi' || constructedUrl.startsWith('upi://'))) {
          try {
            if (UPIChooser && typeof UPIChooser.openUPIChooser === 'function') {
              await UPIChooser.openUPIChooser(constructedUrl);
              return;
            }
          } catch (e) {}
        }

        if (constructedUrl.startsWith('upi://')) {
          await showUpiAppChooser(constructedUrl);
          return;
        }

        try {
          const canOpen = await Linking.canOpenURL(constructedUrl);
          if (canOpen) {
            startPaymentStatusPollingRef.current();
            await Linking.openURL(constructedUrl);
          } else {
            Alert.alert('No UPI App Found', 'Please install a UPI app.', [{ text: 'OK' }]);
          }
        } catch (e) {
          Alert.alert('Error', 'Could not open the payment app.', [{ text: 'OK' }]);
        }
      } catch (e) {}
      return;
    }

    if (url.startsWith('upi://')) {
      await showUpiAppChooser(url);
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        startPaymentStatusPollingRef.current();
        await Linking.openURL(url);
      } else {
        Alert.alert('Payment App Not Found', 'Please install the required app.', [{ text: 'OK' }]);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open the payment app.', [{ text: 'OK' }]);
    }
  }, [showUpiAppChooser]);

  const stopPaymentStatusPolling = useCallback(() => {
    if (paymentVerificationIntervalRef.current) {
      clearInterval(paymentVerificationIntervalRef.current);
      paymentVerificationIntervalRef.current = null;
    }
    setVerifyingPayment(false);
  }, []);

  const handlePaymentOutcome = useCallback((status: string) => {
    if (paymentStatusHandledRef.current) return;
    const resolvedStatus = normalizePaymentOutcome(status) || 'Failure';
    paymentStatusHandledRef.current = true;
    setLoading(false);
    stopPaymentStatusPolling();
    resetPaymentTracking();

    if (resolvedStatus === 'Success') {
      Alert.alert('Payment Successful', 'Your subscription has been activated!', [{
        text: 'OK',
        onPress: () => navigation.reset({ index: 0, routes: [{ name: 'MainTabs', params: { screen: 'Settings' } }] }),
      }]);
      return;
    }

    const isCancelled = resolvedStatus === 'Aborted';
    Alert.alert(
      isCancelled ? 'Payment Cancelled' : 'Payment Failed',
      isCancelled
        ? 'Your payment was cancelled. You can start a new payment from the plans screen.'
        : 'Your payment was not completed. Please try again from the plans screen.',
      [{
        text: 'OK',
        onPress: () => {
          // Navigate back to SubscriptionPlansScreen so a fresh order is created.
          // Reusing the same cancelled orderId causes CCAvenue to reject the retry.
          // Include MainTabs underneath so the back button works from SubscriptionPlans.
          navigation.reset({
            index: 1,
            routes: [
              { name: 'MainTabs', params: { screen: 'Settings' } },
              { name: 'SubscriptionPlans' },
            ],
          });
        },
      }]
    );
  }, [navigation, normalizePaymentOutcome, resetPaymentTracking, stopPaymentStatusPolling]);

  const checkPaymentStatusOnce = useCallback(async () => {
    if (!orderId || paymentStatusHandledRef.current) return;

    try {
      const response = await checkPaymentStatus({ orderId }).unwrap();
      const payment = (response as any)?.data ?? response;

      const paymentStatus = normalizePaymentOutcome(payment?.payment_status);
      const orderStatus = normalizePaymentOutcome(payment?.order_status);
      const subscriptionStatus = String(payment?.subscription_status || '').trim().toUpperCase();

      if (paymentStatus === 'Success' || orderStatus === 'Success' || subscriptionStatus === 'ACTIVE') {
        handlePaymentOutcome('Success');
        return;
      }

      if (paymentStatus === 'Aborted' || orderStatus === 'Aborted') {
        handlePaymentOutcome('Aborted');
        return;
      }

      if (paymentStatus === 'Failure' || orderStatus === 'Failure') {
        handlePaymentOutcome('Failure');
        return;
      }

      if (paymentFlowStartedAtRef.current) {
        const elapsed = Date.now() - paymentFlowStartedAtRef.current;
        if (elapsed > 60000 && !paymentCallbackSeenRef.current) {
          setVerificationMessage('Taking longer than usual. Please keep the app open...');
        } else if (elapsed > 30000 && !paymentCallbackSeenRef.current) {
          setVerificationMessage('Still waiting for payment gateway...');
        }
      }

      if (
        paymentVerificationStartedRef.current &&
        paymentFlowStartedAtRef.current &&
        !paymentPendingAlertShownRef.current &&
        Date.now() - paymentFlowStartedAtRef.current >= PAYMENT_STATUS_MAX_WAIT_MS
      ) {
        paymentPendingAlertShownRef.current = true;
        stopPaymentStatusPolling();
        Alert.alert(
          'Still Confirming Payment',
          'We are still waiting for the final payment confirmation. You can keep waiting here or check again later from the subscription screen.',
          [
            {
              text: 'Keep Waiting',
              onPress: () => {
                paymentPendingAlertShownRef.current = false;
                paymentFlowStartedAtRef.current = Date.now();
                startPaymentStatusPollingRef.current();
              },
            },
            {
              text: 'Check Later',
              style: 'cancel',
              onPress: () => {
                fullResetPaymentTracking();
                navigation.reset({
                  index: 1,
                  routes: [
                    { name: 'MainTabs', params: { screen: 'Settings' } },
                    { name: 'SubscriptionPlans' },
                  ],
                });
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('💳 Payment status check failed:', error);
    }
  }, [checkPaymentStatus, handlePaymentOutcome, navigation, normalizePaymentOutcome, orderId, fullResetPaymentTracking, stopPaymentStatusPolling]);

  const startPaymentStatusPolling = useCallback(() => {
    if (!orderId || paymentStatusHandledRef.current) return;

    markPaymentFlowStarted();
    void checkPaymentStatusOnce();

    if (paymentVerificationIntervalRef.current) {
      return;
    }

    paymentVerificationIntervalRef.current = setInterval(() => {
      void checkPaymentStatusOnce();
    }, PAYMENT_STATUS_POLL_INTERVAL_MS);
  }, [checkPaymentStatusOnce, markPaymentFlowStarted, orderId]);

  startPaymentStatusPollingRef.current = startPaymentStatusPolling;

  const handleDeepLink = useCallback((url: string) => {
    if (paymentStatusHandledRef.current) return;
    const statusMatch = url.match(/[?&]status=([^&]+)/);
    const status = statusMatch ? decodeURIComponent(statusMatch[1]) : '';
    const resolvedStatus = normalizePaymentOutcome(status);
    if (resolvedStatus) {
      handlePaymentOutcome(resolvedStatus);
      return;
    }
    paymentCallbackSeenRef.current = true;
    markPaymentFlowStarted('Finalizing payment...');
    startPaymentStatusPollingRef.current();
  }, [handlePaymentOutcome, markPaymentFlowStarted, normalizePaymentOutcome]);

  const handleCallbackPageReached = useCallback(() => {
    paymentCallbackSeenRef.current = true;
    setLoading(false);
    markPaymentFlowStarted('Finalizing payment...');
    void checkPaymentStatusOnce();
  }, [checkPaymentStatusOnce, markPaymentFlowStarted]);

  const handleNavigationStateChange = (navState: any) => {
    if (navState.url.startsWith('pgapp://payment-result')) {
      handleDeepLink(navState.url);
    }
  };

  const handleBackPress = useCallback(() => {
    Alert.alert('Cancel Payment?', 'Are you sure you want to cancel this payment?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: () => {
          stopPaymentStatusPolling();
          fullResetPaymentTracking();
          navigation.reset({
            index: 1,
            routes: [
              { name: 'MainTabs', params: { screen: 'Settings' } },
              { name: 'SubscriptionPlans' },
            ],
          });
        },
      },
    ]);
    return true;
  }, [navigation, fullResetPaymentTracking, stopPaymentStatusPolling]);

  useEffect(() => {
    // Reset all tracking on mount to ensure clean state for each payment attempt
    fullResetPaymentTracking();
  }, [fullResetPaymentTracking]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [handleBackPress]);

  // Prevent React Navigation's default GO_BACK when there's no screen to go back to
  // (e.g. when PaymentWebView was opened directly via deep link as the only route).
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      // Only intercept the GO_BACK action, not our own reset() calls
      if (e.data.action.type !== 'GO_BACK') return;
      e.preventDefault();
      handleBackPress();
    });
    return unsubscribe;
  }, [navigation, handleBackPress]);

  useEffect(() => {
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      if (url.startsWith('pgapp://payment-result')) {
        handleDeepLink(url);
      }
    });

    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      const previousAppState = appStateRef.current;
      appStateRef.current = nextAppState;

      if (
        (previousAppState === 'inactive' || previousAppState === 'background') &&
        nextAppState === 'active' &&
        paymentVerificationStartedRef.current &&
        !paymentStatusHandledRef.current &&
        !paymentCallbackSeenRef.current
      ) {
        console.log('💳 App returned to foreground, checking payment status');
        startPaymentStatusPolling();
      }
    });

    return () => {
      linkingSubscription.remove();
      appStateSubscription.remove();
      stopPaymentStatusPolling();
      fullResetPaymentTracking();
      // Clean up WebView-side intervals to prevent orphaned polls
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(
          `try{if(window.__CCAV_UPI_POLL_INTERVAL__){window.clearInterval(window.__CCAV_UPI_POLL_INTERVAL__);window.__CCAV_UPI_POLL_INTERVAL__=null;}if(window.__CCAV_VISIBILITY_LISTENER__){document.removeEventListener('visibilitychange',window.__CCAV_VISIBILITY_LISTENER__,false);}if(window.__CCAV_RETURNED_VISIBLE_LISTENER__){document.removeEventListener('visibilitychange',window.__CCAV_RETURNED_VISIBLE_LISTENER__,false);}}catch(e){} true;`
        );
      }
    };
  }, [handleDeepLink, fullResetPaymentTracking, startPaymentStatusPolling, stopPaymentStatusPolling]);

  // Handle messages from injected JS (upi:// URL interception)
  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'upi_url' && data.url) {
        console.log('💳 JS intercepted UPI URL');
        setTimeout(() => {
          openExternalPaymentUrl(data.url).catch((err) => {
            console.error('💳 Error opening JS-intercepted UPI URL:', err);
          });
        }, 0);
      } else if (data.type === 'ccav_choose_upi_app') {
        console.log('💳 CCAvenue UPI chooser requested');
        setTimeout(() => {
          showUpiAppChooser('ccavenues://chooser').catch((err) => {
            console.error('💳 Error showing CCAvenue UPI chooser:', err);
          });
        }, 0);
      } else if (data.type === 'ccav_app_link' && data.url) {
        console.log('💳 CCAvenue app deeplink:', data.appKey);
        allowedPageLaunchUrlRef.current = data.url;
        startPaymentStatusPolling();
        if (webViewRef.current) {
          const launchScript = `window.__CCAV_OPEN_EXACT_APP_LINK && window.__CCAV_OPEN_EXACT_APP_LINK(${JSON.stringify(data.url)}); true;`;
          webViewRef.current.injectJavaScript(launchScript);
        }
      } else if (data.type === 'debug_log') {
        // Only log CCAV FALLBACK and CCAV APP LINK messages, suppress interceptor noise
        if (data.msg && (data.msg.indexOf('CCAV') === 0 || data.msg.indexOf('UPI_INTERCEPT: All') === 0)) {
          console.log('🔍 JS:', data.msg);
        }
      }
    } catch (e) {}
  }, [openExternalPaymentUrl, showUpiAppChooser, startPaymentStatusPolling]);

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.primary}>
      <ScreenHeader title="Payment" showBackButton onBackPress={handleBackPress} />
      <View style={styles.container}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
          </View>
        )}
        {verifyingPayment && !paymentStatusHandledRef.current && (
          <View style={styles.verificationOverlay}>
            <View style={styles.verificationCard}>
              <ActivityIndicator size="large" color={Theme.colors.primary} />
              <Text style={styles.verificationTitle}>{verificationMessage}</Text>
              <Text style={styles.verificationSubtitle}>
                Please wait on this screen and do not close the app until payment confirmation is completed.
              </Text>
            </View>
          </View>
        )}
        <WebView
          source={{ html: paymentFormHtml }}
          ref={webViewRef}
          onLoadStart={(e) => {
            const url = e.nativeEvent.url;
            const isCallbackOrCancelPage = url.includes(PAYMENT_CALLBACK_PATH) || url.includes(PAYMENT_CANCEL_PATH);
            setLoading(!isCallbackOrCancelPage);
            if (isCallbackOrCancelPage) {
              handleCallbackPageReached();
            }
          }}
          onLoadEnd={(e) => {
            setLoading(false);
            const url = e.nativeEvent.url;
            if (url.includes(PAYMENT_CALLBACK_PATH) || url.includes(PAYMENT_CANCEL_PATH)) {
              handleCallbackPageReached();
            }
            if (webViewRef.current) {
              webViewRef.current.injectJavaScript(`window.__UPI_PLATFORM__='${Platform.OS}';` + UPI_INTERCEPT_JS);
            }
          }}
          onNavigationStateChange={handleNavigationStateChange}
          onMessage={handleMessage}
          // Catch window.open() and target="_blank" — CCAvenue may use this to trigger upi://
          onOpenWindow={(event) => {
            const url = event.nativeEvent.targetUrl;
            if (isPaymentUrl(url) || url.startsWith('upi://')) {
              openExternalPaymentUrl(url).catch((err) => {
                console.error('💳 Error opening URL from onOpenWindow:', err);
              });
            }
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          style={styles.webview}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          cacheEnabled={true}
          mixedContentMode="always"
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          // Inject UPI interceptor JS BEFORE page scripts run
          injectedJavaScriptBeforeContentLoaded={`window.__UPI_PLATFORM__='${Platform.OS}';` + UPI_INTERCEPT_JS}
          // Also inject after load (for subsequent navigations)
          injectedJavaScript={`window.__UPI_PLATFORM__='${Platform.OS}';` + UPI_INTERCEPT_JS}
          // Use Android User-Agent on both platforms so CCAvenue shows UPI Intent
          userAgent={'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'}
          onShouldStartLoadWithRequest={(request) => {
            const url = request.url;

            if (url.startsWith('pgapp://payment-result')) {
              handleDeepLink(url);
              return false;
            }

            if (url.includes(PAYMENT_CALLBACK_PATH) || url.includes(PAYMENT_CANCEL_PATH)) {
              handleCallbackPageReached();
              return true;
            }

            if (url.startsWith('http://') || url.startsWith('https://')) return true;
            if (url === 'about:blank') return true;

            // Allow one exact CCAvenue app deeplink to be launched by the page itself.
            if (allowedPageLaunchUrlRef.current && url === allowedPageLaunchUrlRef.current) {
              allowedPageLaunchUrlRef.current = null;
              return true;
            }

            // Intercept UPI and payment scheme URLs
            if (isPaymentUrl(url)) {
              openExternalPaymentUrl(url).catch((err) => {
                console.error('💳 Error opening payment URL:', err);
              });
              return false;
            }

            return false;
          }}
          onError={() => {
            setLoading(false);
            showErrorAlert(null, 'Payment Load Error');
          }}
          onHttpError={() => {
            setLoading(false);
            showErrorAlert(null, 'Payment Page Error');
          }}
        />

        {/* Android UPI App Chooser Bottom Sheet */}
        <SlideBottomModal
          visible={upiChooserVisible}
          onClose={() => setUpiChooserVisible(false)}
          title="Pay with UPI App"
          subtitle="Select a UPI app to complete your payment"
          cancelLabel="Cancel"
          onCancel={() => setUpiChooserVisible(false)}
          enableFlexibleHeightDrag
          minHeightPercent={0.5}
        >
          <View style={{ paddingHorizontal: 4, paddingTop: 4 }}>
            {UPI_APPS_ANDROID.map((item) => (
              <AnimatedPressableCard
                key={item.appKey}
                onPress={() => {
                  setUpiChooserVisible(false);
                  handleUpiAppSelection(upiChooserUrlRef.current, item);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  marginBottom: 8,
                  backgroundColor: Theme.colors.background.secondary,
                  gap: 14,
                }}
              >
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: Theme.colors.background.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Ionicons name={item.icon as any} size={22} color={Theme.colors.primary} />
                </View>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: Theme.colors.text.primary,
                  flex: 1,
                }}>
                  {item.name}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={Theme.colors.text.tertiary} />
              </AnimatedPressableCard>
            ))}
          </View>
        </SlideBottomModal>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background.primary },
  loadingContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: Theme.colors.background.primary, zIndex: 2,
  },
  verificationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    paddingHorizontal: 20,
  },
  verificationCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  verificationTitle: {
    marginTop: 18,
    textAlign: 'center',
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  verificationSubtitle: {
    marginTop: 12,
    textAlign: 'center',
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 20,
  },
  webview: { flex: 1 },
});
