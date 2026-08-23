const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Config plugin that patches react-native-webview's iOS native code to
 * route custom URL schemes (upi://, gpay://, phonepe://, etc.) through
 * onShouldStartLoadWithRequest instead of auto-opening them.
 *
 * Without this patch, iOS WKWebView opens upi:// URLs at the native level
 * BEFORE onShouldStartLoadWithRequest is called, making it impossible to
 * intercept them in JavaScript.
 */

function patchWebViewImpl(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('// UPI_INTERCEPTOR_PATCH_START')) {
    console.log('[withPatch] RNCWebViewImpl.m already patched');
    return;
  }
  const oldCode = `    WKNavigationType navigationType = navigationAction.navigationType;
    NSURLRequest *request = navigationAction.request;
    BOOL isTopFrame = [request.URL isEqual:request.mainDocumentURL];
    BOOL hasTargetFrame = navigationAction.targetFrame != nil;

    if (_onOpenWindow && !hasTargetFrame) {`;

  const newCode = `    WKNavigationType navigationType = navigationAction.navigationType;
    NSURLRequest *request = navigationAction.request;
    BOOL isTopFrame = [request.URL isEqual:request.mainDocumentURL];
    BOOL hasTargetFrame = navigationAction.targetFrame != nil;

    // UPI_INTERCEPTOR_PATCH_START
    if (request.URL) {
        NSString *scheme = request.URL.scheme;
        if (scheme && ![scheme isEqualToString:@"http"] && ![scheme isEqualToString:@"https"] && ![scheme isEqualToString:@"about"] && ![scheme isEqualToString:@"blob"] && ![scheme isEqualToString:@"data"] && ![scheme isEqualToString:@"file"]) {
            NSLog(@"UPI_INTERCEPTOR: Custom scheme detected: %@", scheme);
            if (_onShouldStartLoadWithRequest) {
                int lockIdentifier = [[RNCWebViewDecisionManager getInstance] setDecisionHandler: ^(BOOL shouldStart){
                    dispatch_async(dispatch_get_main_queue(), ^{
                        NSLog(@"UPI_INTERCEPTOR: JS returned %d for %@", shouldStart, request.URL.absoluteString);
                        decisionHandler(WKNavigationActionPolicyCancel);
                    });
                }];
                NSMutableDictionary<NSString *, id> *event = [self baseEvent];
                if (request.mainDocumentURL) {
                  [event addEntriesFromDictionary: @{
                    @"mainDocumentURL": (request.mainDocumentURL).absoluteString,
                  }];
                }
                [event addEntriesFromDictionary: @{
                    @"url": (request.URL).absoluteString,
                    @"navigationType": navigationTypes[@(navigationType)],
                    @"isTopFrame": @(isTopFrame),
                    @"hasTargetFrame": @(hasTargetFrame),
                    @"lockIdentifier": @(lockIdentifier)
                }];
                NSLog(@"UPI_INTERCEPTOR: Calling onShouldStartLoadWithRequest: %@", (request.URL).absoluteString);
                _onShouldStartLoadWithRequest(event);
                return;
            }
            NSLog(@"UPI_INTERCEPTOR: No handler, cancelling: %@", request.URL.absoluteString);
            decisionHandler(WKNavigationActionPolicyCancel);
            return;
        }
    }
    // UPI_INTERCEPTOR_PATCH_END

    if (_onOpenWindow && !hasTargetFrame) {`;

  if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('[withPatch] SUCCESS: Patched RNCWebViewImpl.m');
  }
}

function withWebViewUpiInterceptor(config) {
  config = withDangerousMod(config, [
    'ios',
    (config) => {
      const projectRoot = config.modRequest.projectRoot;

      const webviewPath = path.join(
        projectRoot, 'node_modules', 'react-native-webview', 'apple', 'RNCWebViewImpl.m'
      );
      console.log('[withPatch] Patching webview:', webviewPath);
      patchWebViewImpl(webviewPath);

      // Also patch Pods copy if it exists
      const podsWebviewPath = path.join(
        config.modRequest.platformProjectRoot, 'Pods', 'Development Pods',
        'react-native-webview', 'apple', 'RNCWebViewImpl.m'
      );
      patchWebViewImpl(podsWebviewPath);

      return config;
    },
  ]);

  return config;
}

module.exports = withWebViewUpiInterceptor;
