import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  // Some native modules (e.g. the Google Mobile Ads banner) resolve their root
  // view controller through the app delegate's window, so it must keep
  // existing under the scene lifecycle. SceneDelegate assigns it.
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    return true
  }
}

// iPadOS 27 terminates apps that launch through the legacy UIApplication
// lifecycle, so the window is created here from the connecting scene rather
// than in didFinishLaunchingWithOptions. Referenced from the
// UIApplicationSceneManifest entry in Info.plist.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else { return }
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory else { return }

    // Prevent white flash before JS renders
    let background = UIColor(red: 10.0 / 255, green: 10.0 / 255, blue: 15.0 / 255, alpha: 1.0)

    let window = UIWindow(windowScene: windowScene)
    window.backgroundColor = background

    factory.startReactNative(
      withModuleName: "RetroGameCollection",
      in: window,
      launchOptions: nil
    )

    window.rootViewController?.view.backgroundColor = background
    self.window = window
    appDelegate.window = window
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
