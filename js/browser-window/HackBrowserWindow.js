'use strict';

const remote = require('electron').remote;

/**
 * HackBrowserWindow controls all activities related to a browser window
 * all browser-related public-APIs can be accessed through HackBrowserWindow instance
 *
 * @constructor
 */
function HackBrowserWindow() {
	var _this = this;

	/* ====================================
	 private member variables
	 ====================================== */
	var activeTabView;
	var createdTabViewCount;
	var openTabViewCount;
	var tabList;
	var menuBar;
	var addressBar;
	var addTabBtnEl;


	/* ====================================
	 private methods
	 ====================================== */
	var init = function() {
		// create a new MenuBar object associated with current browser window
		menuBar = new MenuBar(_this);
		addressBar = new AddressBar(_this);
		createdTabViewCount = 0;
		openTabViewCount = 0;
		tabList = {};
		addTabBtnEl = document.getElementById("add-tab");

		_this.addNewTab("http://www.google.com/", true);

		attachEventHandlers();
	};

	var attachEventHandlers = function() {
		addTabBtnEl.addEventListener("click", function(e) {
			_this.addNewTab(null, true);

			e.preventDefault();
		});
	};


	/* ====================================
	 public methods
	 ====================================== */
	_this.navigateTo = function(url) {
		activeTabView.navigateTo(url);
	};

	_this.updateWindowTitle = function(title) {
		document.title = title;
	};

	/**
	 * Create a new browser tab
	 *
	 * @param url {string} URL to open, if left null, a "blank-page" will be displayed
	 * @param activate {boolean} whether to activate the new tab immediately (optional, defaults to true)
	 *
	 * @returns {string} ID of new tab
	 */
	_this.addNewTab = function(url, activate) {
		var newTabView = new TabView(_this, url);
		var newTabViewId = newTabView.getId();

		// the default option for activating tab
		// if no argument was supplied for "activate" option, turn it on
		if (activate === undefined) { activate = true; }

		// add TabView to list
		tabList[newTabViewId] = newTabView;

		// activate tab
		if (activate === true) {
			_this.activateTabById(newTabViewId);

			if (!addressBar.isAddressBarFocused()) {
				addressBar.focusOnAddressBar();
			};
		}

		// increase open tab count
		openTabViewCount++;

		return newTabViewId;
	};

	_this.activateTabById = function(tabViewId) {
		console.log("activateTabById(" + tabViewId + ")");

		if (activeTabView && (activeTabView.getId() === tabViewId)) {
			console.log("already active tab");
			return;
		}

		if(tabList.hasOwnProperty(tabViewId) === true) {
			if (activeTabView) {
				activeTabView.deactivate();
			}

			activeTabView = tabList[tabViewId];

			// activate new tab view
			activeTabView.activate();

			_this.updateWindowControls();
		}
	};


	_this.updateWindowControls = function() {
		// check if active webview is still loading
		// if webViewEl.canGoBack() or webViewEl.canGoForward() is called in menuBar.updateBtnStatus()
		// before <webview> element is loaded, an exception will be thrown
		if (activeTabView.isDOMReady() === true) {
			// update back/forward button status
			menuBar.updateBtnStatus(activeTabView.getWebViewEl());
		} else {
			menuBar.disableBackBtn();
			menuBar.disableForwardBtn();
		}

		_this.updateWindowTitle(activeTabView.getWebViewTitle());
		addressBar.updateURL(activeTabView.getURL());
	};

	_this.getMenuBar = function() {
		return menuBar;
	};

	_this.getActiveTabView = function() {
		return activeTabView;
	};

	/**
	 * increase total number of created tabs including closed ones
	 * this method should be exposed publicly in case a new tab is created programmatically
	 */
	_this.increaseCreatedTabViewCount = function() {
		createdTabViewCount++;
	};

	/**
	 * return number of total created tabs including closed ones
	 *
	 * @returns {int} created tab count
	 */
	_this.getCreatedTabViewCount = function() {
		return createdTabViewCount;
	};

	/**
	 * navigate back on active TabView
	 *
	 * @returns {boolean} whether navigating backwards was successful
	 */
	_this.goBack = function() {
		var didGoBack = false;

		if ((activeTabView.isDOMReady() === true) && (activeTabView.getWebViewEl().canGoBack() === true)) {
			activeTabView.getWebViewEl().goBack();
			didGoBack = true;
		}

		return didGoBack;
	};

	/**
	 * navigate forward on active TabView
	 *
	 * @returns {boolean} whether navigating forward was successful
	 */
	_this.goForward = function() {
		var didGoForward = false;

		if ((activeTabView.isDOMReady() === true) && (activeTabView.getWebViewEl().canGoForward() === true)) {
			activeTabView.getWebViewEl().goForward();
			didGoForward = true;
		}

		return didGoForward;
	};

	/**
	 * reload (refresh) page on active TabView
	 */
	_this.reload = function() {
		activeTabView.getWebViewEl().reload();
	};

	/**
	 * remove specific TabView object from tabList object
	 * for garbage collection
	 *
	 * this method should be called when a tab is closed in the browser
	 *
	 * @param tabViewId
	 */
	_this.closeTabById = function(tabViewId) {
		delete tabList[tabViewId];

		openTabViewCount--;

		// if no tabs are open, close window
		if (openTabViewCount === 0) {
			var currentWindow = remote.getCurrentWindow();
			currentWindow.close();
		}
	};

	init();
}
