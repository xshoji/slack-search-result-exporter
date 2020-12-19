"use strict";
//
// ==UserScript==
// @name         slack-search-result-exporter
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Exports Slack messages as TSV from Search results.
// @author       xshoji
// @match        https://app.slack.com/*
// @require      https://raw.githubusercontent.com/xshoji/slack-search-result-exporter/main/slack-search-result-exporter.user.js
// @updateURL    https://raw.githubusercontent.com/xshoji/slack-search-result-exporter/main/slack-search-result-exporter.user.js
// @downloadURL  https://raw.githubusercontent.com/xshoji/slack-search-result-exporter/main/slack-search-result-exporter.user.js
// @supportURL   https://raw.githubusercontent.com/xshoji/slack-search-result-exporter
// @grant        none
// ==/UserScript==

/**
 * slack-search-result-exporter
 */
let global = window;

global = {
  SlackSearchResultExporter: {}
};

/**
 * Gather slack messages in search results. Then gathered messages are shown as a popup window.
 * < This is main method. >
 */
global.SlackSearchResultExporter.exportMessage = function () {
  const messagePack = {
    messages: [],
    hasNexPage: true,
  };
  // Gather messages in all pages.
  this.getMessage(messagePack);
}

/**
 * Gather slack messages in all page of search result.
 * @param messagePack
 */
global.SlackSearchResultExporter.getMessage = function (messagePack) {
  if (!messagePack.hasNexPage) {
    // If next page doesn't exist, display popup is include gathered messages.
    this.showMessagesPopup(messagePack);
    return;
  }
  (async () => {
    // Wait searched results and gather these messages.
    await this.createPromiseWaitSearchResult()
      .then(async () => await this.createPromiseWaitMillisecond(400))
      .then(() => this.createPromiseGetMessages(messagePack))
      .then(async () => await this.createPromiseWaitMillisecond(400))
      .then(() => this.createPromiseClickNextButton(messagePack))
      .then(async () => await this.createPromiseWaitMillisecond(400))
      .then(() => this.getMessage(messagePack));
  })();
}

/**
 * Wait display searched result.
 */
global.SlackSearchResultExporter.createPromiseWaitSearchResult = function () {
  const selector = ".c-search_message__body";
  return new Promise((resolve) => {
    const el = document.querySelector(selector);
    if (el) {
      resolve(el);
    }
    new MutationObserver((mutationRecords, observer) => {
      // Query for elements matching the specified selector
      Array.from(document.querySelectorAll(selector)).forEach((element) => {
        resolve(element);
        //Once we have resolved we don't need the observer anymore.
        observer.disconnect();
      });
    })
      .observe(document.documentElement, {
        childList: true,
        subtree: true
      })
  });
}


/**
 * Get message
 */
global.SlackSearchResultExporter.createPromiseGetMessages = function (messagePack) {
  const messageGroupSelector = ".c-message_group";
  const messageContentSelector = ".c-search_message__content";
  const messageTimestampSelector = ".c-timestamp";
  const messageTimestampAttributeKey = "data-ts";
  const channelNameSelector = ".p-deprecated_channel_name__text";
  const messageSenderSelector = ".c-message__sender_link";
  const timestampLabelSelector = ".c-timestamp__label";
  
  return new Promise((resolve) => {
    let messageGroups = document.querySelectorAll(messageGroupSelector);
    
    messageGroups.forEach((messageGroup) => {
      const datetime = this.timestampToTime(messageGroup.querySelector(messageTimestampSelector).getAttribute(messageTimestampAttributeKey).split(".")[0]);
      // qiita_twitter_bot
      const channelName = messageGroup.querySelector(channelNameSelector).textContent
      // twitter
      const messageSender = messageGroup.querySelector(messageSenderSelector).textContent
      // 8:00 PM
      const timestampLabel = messageGroup.querySelector(timestampLabelSelector).textContent
      // twitterAPP 8:00 PMslack message here ... 
      const message = messageGroup.querySelector(messageContentSelector).textContent;
      const removeMessageSender = new RegExp('^' + messageSender);
      const removeTimestampLabel = new RegExp('^.*?' + timestampLabel);
      // APP 8:00 PMslack message here ... 
      const trimmedMessage = message.replace(removeMessageSender, '').replace(removeTimestampLabel, '');
      // 2020/12/19 20:00:20 <tab> qiita_twitter_bot <tab> twitter <tab> slack message here ... 
      const timeAndMessage = datetime + "\t" + channelName + "\t" + messageSender + "\t" + trimmedMessage;
      messagePack.messages.push(timeAndMessage);
    });
    resolve(messagePack);
  });
}

/**
 * Click next element
 */
global.SlackSearchResultExporter.createPromiseClickNextButton = function (messagePack) {
  messagePack.hasNexPage = document.querySelector(".c-search__pager__button_forward") !== null;
  if (!messagePack.hasNexPage) {
    // Return dummy promise.
    return new Promise((resolve) => {
      resolve(messagePack);
    })
  }
  return new Promise((resolve) => {
    document.querySelector(".c-search__pager__button_forward").click();
    resolve(messagePack);
  });
}

/**
 * Wait specified millisecond
 */
global.SlackSearchResultExporter.createPromiseWaitMillisecond = function (millisecond) {
  return new Promise(resolve => setTimeout(resolve, millisecond));
}

/**
 * timestamp to datetame
 * @param timestamp
 * @returns {string}
 */
global.SlackSearchResultExporter.timestampToTime = function (timestamp) {
  const d = new Date(timestamp * Math.pow(10, 13 - timestamp.length));
  return d.toLocaleDateString("ja-JP") + " " + d.toLocaleTimeString("ja-JP");
}

/**
 * Display messages as a popup window.
 * [!] It seems like large text content cannot be copied automatically by js. So this script made user copies gathered messages by oneself.
 * > javascript - Copying to clipboard with document.execCommand('copy') fails with big texts - Stack Overflow
 * > https://stackoverflow.com/questions/44774820/copying-to-clipboard-with-document-execcommandcopy-fails-with-big-texts
 * @param messagePack
 * @returns {boolean}
 */
global.SlackSearchResultExporter.showMessagesPopup = function (messagePack) {
  const massageAll = messagePack.messages.join("\n");
  console.log("----------------------");
  console.log("showMessagesPopup : messagePack.messages.length " + messagePack.messages.length);
  console.log("showMessagesPopup : massageAll.length " + massageAll.length);
  console.log("----------------------");
  
  const textareaElement = document.createElement("textarea");
  // > html - How to adjust textarea size with javascript? - Stack Overflow  
  // > https://stackoverflow.com/questions/31734233/how-to-adjust-textarea-size-with-javascript
  textareaElement.rows = 10;
  textareaElement.cols = 50;
  textareaElement.textContent = massageAll;
  
  // > Open window in JavaScript with HTML inserted - Stack Overflow  
  // > https://stackoverflow.com/questions/2109205/open-window-in-javascript-with-html-inserted
  const win = window.open("", "Slack messages", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=500,height=300,top=" + (screen.height - 200) + ",left=" + (screen.width - 200));
  win.document.body.appendChild(textareaElement);
  
  return true;
}
