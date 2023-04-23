"use strict";

(() => {
  
  const enableDebugMode = true;
  
  const log = (value) => {
    if (enableDebugMode === true) {
      console.log(value);
    }
  };
  
  /**
   * Gather Slack messages in all page of search result.
   * @param messagePack
   */
  const getMessage = (messagePack) => {
    log(">>> getMessage");
    if (!messagePack.hasNextPage) {
      log("exportMessage::messagePack.hasNextPage = " + messagePack.hasNextPage);
      /* If next page doesn't exist, display popup includes gathered messages */
      showMessagesPopup(messagePack);
      return;
    }
    (async () => {
      /* Wait searched results and gather these messages */
      await createPromiseWaitSearchResult();
      do {
        await createPromiseWaitMillisecond(800);
        await createPromiseGetMessages(messagePack);  
      } while (messagePack.messagePushed === true);
      await createPromiseClickNextButton(messagePack);
      await createPromiseWaitMillisecond(600);
      await getMessage(messagePack);
    })();
  };
  
  /**
   * Wait display searched result.
   */
  const createPromiseWaitSearchResult = () => {
    log(">>> createPromiseWaitSearchResult");
    const selector = ".c-search_message__content";
    return new Promise((resolve) => {
      const el = document.querySelector(selector);
      if (el) {
        resolve(el);
      }
      new MutationObserver((mutationRecords, observer) => {
        /* Query for elements matching the specified selector */
        Array.from(document.querySelectorAll(selector)).forEach((element) => {
          resolve(element);
          /* Once we have resolved we don't need the observer anymore */
          observer.disconnect();
        });
      })
        .observe(document.documentElement, {
          childList: true,
          subtree: true
        });
    });
  };
  
  /**
   * Get message
   */
  const createPromiseGetMessages = async (messagePack) => {
    log(">>> createPromiseGetMessages");
    const messageGroupSelector = ".c-message_group";
    const messageContentSelector = ".c-search_message__content";
    const messageTimestampSelector = ".c-timestamp";
    const messageTimestampAttributeKey = "data-ts";
    const channelNameSelector = ".c-channel_entity__name";
    const messageSenderSelector = ".c-message__sender_button";
    const timestampLabelSelector = ".c-timestamp__label";
    
    return new Promise((resolve) => {
      messagePack.messagePushed = false;
      let messageGroups = document.querySelectorAll(messageGroupSelector);
      log("createPromiseGetMessages | Promise | messageGroups.length = " + messageGroups.length);
      
      messageGroups.forEach((messageGroup) => {
        const datetime = timestampToTime(messageGroup.querySelector(messageTimestampSelector).getAttribute(messageTimestampAttributeKey).split(".")[0]);
        /* qiita_twitter_bot */
        const channelName = messageGroup.querySelector(channelNameSelector).textContent;
        /* twitter */
        const messageSender = messageGroup.querySelector(messageSenderSelector).textContent;
        /* 8:00 PM */
        const timestampLabel = messageGroup.querySelector(timestampLabelSelector).textContent;
        /* twitterAPP 8:00 PM slack message here ...  */
        const message = messageGroup.querySelector(messageContentSelector).textContent;
        const removeMessageSender = new RegExp('^' + escapeRegExp(messageSender));
        const removeTimestampLabel = new RegExp('^.*?' + timestampLabel);
        /* APP 8:00 PM slack message here ...  */
        const trimmedMessage = message.replace(removeMessageSender, '').replace(removeTimestampLabel, '');
        /* 2020/12/19 20:00:20 <tab> qiita_twitter_bot <tab> twitter <tab> slack message here ...  */
        const timeAndMessage = datetime + "\t" + channelName + "\t" + messageSender + "\t" + trimmedMessage;
        log("createPromiseGetMessages | Promise | messageGroups.forEach | " + [datetime, channelName, messageSender, timestampLabel, message].join(", "));
        log("createPromiseGetMessages | Promise | messageGroups.forEach | " + timeAndMessage);
        if (messagePack.messageSet.has(timeAndMessage)) {
          log("createPromiseGetMessages | Promise | messagePack.messageSet.has(timeAndMessage) === true | " + timeAndMessage);
          return;
        }
        messagePack.messages.push(timeAndMessage);
        messagePack.messagePushed = true;
        messagePack.messageSet.add(timeAndMessage);
        messageGroup.scrollIntoView();
      });
      resolve(messagePack);
    });
  };
  
  /**
   * Click next page link
   */
  const createPromiseClickNextButton = (messagePack) => {
    log(">>> createPromiseClickNextButton");
    const arrowBtnElements = document.querySelectorAll(".c-pagination__arrow_btn");
    let nextArrowBtnElement = null
    messagePack.hasNextPage = false
    if (arrowBtnElements.length === 0) {
      // Return dummy promise
      return new Promise((resolve) => {
        resolve(messagePack);
      })
    }
    arrowBtnElements.forEach((e) => {
      if (["Next page", "次のページ"].includes(e.getAttribute("aria-label"))) {
        nextArrowBtnElement = e;
      }
    })
      messagePack.hasNextPage = !nextArrowBtnElement.outerHTML.includes("disabled");
    if (!messagePack.hasNextPage) {
      log("createPromiseClickNextButton | messagePack.hasNextPage = " + messagePack.hasNextPage);
      /* Return dummy promise */
      return new Promise((resolve) => {
        resolve(messagePack);
      })
    }
    return new Promise((resolve) => {
      log("createPromiseClickNextButton | Promise | click()");
      nextArrowBtnElement.click();
      resolve(messagePack);
    });
  };
  
  /**
   * Wait specified millisecond
   */
  const createPromiseWaitMillisecond = (millisecond) => {
    return new Promise(resolve => setTimeout(resolve, millisecond));
  };
  
  /**
   * timestamp to datetame
   * @param timestamp
   * @returns {string}
   */
  const timestampToTime = (timestamp) => {
    const d = new Date(timestamp * Math.pow(10, 13 - timestamp.length));
    const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const yyyy = d.getFullYear();
    const mm = ("0" + (d.getMonth() + 1)).slice(-2);
    const dd = ("0" + d.getDate()).slice(-2);
    const hh = ("0" + d.getHours()).slice(-2);
    const mi = ("0" + d.getMinutes()).slice(-2);
    const ss = ("0" + d.getSeconds()).slice(-2);
    const week = weekday[d.getDay()];
    return `${yyyy}-${mm}-${dd} ${week} ${hh}:${mi}:${ss}`;
  };
  
  /**
   * Escape regex meta characters
   * > Escape string for use in Javascript regex - Stack Overflow
   * > https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
   * @param stringValue
   * @returns {*}
   */
  const escapeRegExp = (stringValue) => {
    /* $& means the whole matched string */
    return stringValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  
  /**
   * Display messages as a popup window.
   * [!] It seems like large text content cannot be copied automatically by js. So this script made user copies gathered messages by oneself.
   * > javascript - Copying to clipboard with document.execCommand('copy') fails with big texts - Stack Overflow
   * > https://stackoverflow.com/questions/44774820/copying-to-clipboard-with-document-execcommandcopy-fails-with-big-texts
   * @param messagePack
   * @returns {boolean}
   */
  const showMessagesPopup = (messagePack) => {
    log(">>> showMessagesPopup");
    const massageAll = messagePack.messages.join("\n");
    log("showMessagesPopup | messagePack.messages.length " + messagePack.messages.length);
    log("showMessagesPopup | massageAll.length " + massageAll.length);
    
    const textareaElement = document.createElement("textarea");
    /* html - How to adjust textarea size with javascript? - Stack Overflow */ 
    /* https://stackoverflow.com/questions/31734233/how-to-adjust-textarea-size-with-javascript */
    textareaElement.rows = 10;
    textareaElement.cols = 50;
    textareaElement.textContent = massageAll;
    
    /* Open window in JavaScript with HTML inserted - Stack Overflow */
    /* https://stackoverflow.com/questions/2109205/open-window-in-javascript-with-html-inserted */
    const win = window.open("", "Slack messages", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=500,height=300,top=" + (screen.height - 200) + ",left=" + (screen.width - 200));
    win.document.body.appendChild(textareaElement);
    
    return true;
  };
  
  const exportMessage = () => {
    log(">>> exportMessage");
    const messagePack = {
      messages: [],
      messageSet: new Set(),
      messagePushed: false,
      hasNextPage: true,  /* To handle a first loop */
    };
    /* Gather messages in all pages */
    getMessage(messagePack);
  };
  
  /* Run */
  exportMessage();
})();
