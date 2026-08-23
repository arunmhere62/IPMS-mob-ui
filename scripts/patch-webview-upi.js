#!/usr/bin/env node
/**
 * Postinstall script that patches react-native-webview's iOS native code
 * to route custom URL schemes (upi://, gpay://, etc.) through
 * onShouldStartLoadWithRequest instead of auto-opening them.
 */
const fs = require('fs');
const path = require('path');

const webviewPath = path.join(
  __dirname, '..', 'node_modules', 'react-native-webview', 'apple', 'RNCWebViewImpl.m'
);

if (!fs.existsSync(webviewPath)) {
  console.log('[patch] RNCWebViewImpl.m not found, skipping');
  process.exit(0);
}

let content = fs.readFileSync(webviewPath, 'utf8');

if (content.includes('// UPI_INTERCEPTOR_PATCH_START')) {
  console.log('[patch] RNCWebViewImpl.m already patched');
  process.exit(0);
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
  fs.writeFileSync(webviewPath, content, 'utf8');
  console.log('[patch] SUCCESS: Patched RNCWebViewImpl.m');
} else {
  console.warn('[patch] Could not find target code in RNCWebViewImpl.m');
}
