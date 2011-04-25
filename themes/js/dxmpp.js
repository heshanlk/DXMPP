
/**
 * @file
 * Define the baseline Drupal behaviors for the DXMPP module.
 */
(function ($) {

  // Define status constants.
  var DXMPP_STATUS_INVISIBLE = 3;
  var DXMPP_STATUS_ONLINE = 2;
  var DXMPP_STATUS_AWAY = 1;
  var DXMPP_STATUS_UNAVAILABLE = 0;

  // The global connection object.
  var dxmppConnection;

  // This is set to true when a connection has been authenticated.
  var dxmppConnectionBound = false;

  // A global variable to ensure some document handlers are run only once.
  var dxmppDocumentBehaviorsBound = false;

  // Bind onConnect & onDisconnect behaviors.
  Drupal.behaviors.dxmppBindDocumentBehaviors = function(context) {
    // Only run this one time.
    if (!dxmppDocumentBehaviorsBound) {
      dxmppDocumentBehaviorsBound = true;

      // If we're on a bad browser, then disable the chat.
      if (Drupal.settings.dxmpp.disableOnBadBrowser && dxmppDetectBadBrowser()) {
        // Store the setting so we don't need to recheck later.
        Drupal.settings.dxmpp.disable = true;

        // Display a useful message to the bad user.
        $('#dxmpp-main .dxmpp-title').text(Drupal.settings.dxmpp.disableOnBadBrowserMessageTitle);
        $('#dxmpp-main .dxmpp-content').text(Drupal.settings.dxmpp.disableOnBadBrowserMessage);
        return;
      }

      // So far so good. Let's bind the connected event behavior.
      $(document).bind('connected', function() {
        // When we first connect, grab the most current roster.
        var iq = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});

        // Grab the roster and trigger the dxmppOnRoster function.
        dxmppConnection.sendIQ(iq, dxmppOnRoster);

        // Respond to changes in the roster.
        dxmppConnection.addHandler(dxmppOnRosterChange, "jabber:iq:roster", "iq", "set");

        // Display received messages.
        dxmppConnection.addHandler(dxmppOnMessage, null, "message", "chat");

        // Set our presence.
        dxmppSetPresence();

        dxmppConnectionBound = true;
      });

      $(document).bind('disconnected', function() {
        // We might get a couple of false starts, so check first.
        if (dxmppConnectionBound) {
          // We have disconnected after authenticating, so drop the connection.
          dxmppConnection = null;
          dxmppConnectionBound = false;
        }
      });

      // Set the main title to the connected user count.
      dxmppSetMainTitleToCount();

      // Now attempt to connect to our XMPP server.
      // Note this will trigger the 'connected' behavior set above if successful.
      dxmppConnect();
    }
  }

  /**
   * Returns TRUE if the browser is expected to have problems.
   *
   * By default, things currently look bad in IE6.
   * This is not the best way to go about this: for a better, option, @TODO
   * see http://api.jquery.com/jQuery.support/
   */
  dxmppDetectBadBrowser = function() {
    return jQuery.browser.msie && jQuery.browser.version == 6;
  }

  /**
   * Set the user's online status.
   *
   * We read the setting, which has either been set initially from Drupal,
   * or has been changed manually by the user.
   *
   * We'll send the presence to the XMPP server, then may also send it to the
   * Drupal server for persistent presence settings in the future.
   */
  dxmppSetPresence = function() {
    switch (Drupal.settings.dxmpp.presence) {
      case DXMPP_STATUS_ONLINE:
        dxmppConnection.send($pres());
        break;
      case DXMPP_STATUS_AWAY:
        _presence = $pres({show: 'away'});
        dxmppConnection.send(_presence);
        dxmppConnection.send(_presence);
        break;
      case DXMPP_STATUS_INVISIBLE:
      case DXMPP_STATUS_UNAVAILABLE:
        _presence = $pres({type: 'unavailable'});
        dxmppConnection.send(_presence);
        dxmppConnection.send(_presence);
        break;
    }
    if (Drupal.settings.dxmpp.presence == DXMPP_STATUS_UNAVAILABLE) {
      dxmppConnection.disconnect('User initiated disconnect.');
    }

    if (Drupal.settings.dxmpp.originalPresence != Drupal.settings.dxmpp.presence) {
      // Tell Drupal about the change, but only if it's different than the
      // original setting.
      dxmppDebug('Send an ajax if our presence is different than the original in setPresence.');
      $.ajax({
        type: 'POST',
        url: Drupal.settings.dxmpp.setPresenceURL,
        data: { ajax: true, presence: Drupal.settings.dxmpp.presence, uid: Drupal.settings.dxmpp.mainUID },
        dataType: 'json',
        success: function (data) {
          if (data.status) {
            // Success.
            Drupal.settings.dxmpp.originalPresence = data.presence;
          }
          else {
            // Failure.
          }
        },
        error: function (xmlhttp) {
          // Failure.
        }
      });
    }
  }

  /**
   * Selecting a new status will send a presence message to the XMPP server.
   */
  Drupal.behaviors.dxmppStatusSelect = function(context) {
    if (Drupal.settings.dxmpp.disable) {
      // No sense in continuing if we aren't displaying our chat.
      return;
    }
    $('#dxmpp-main .dxmpp-settings-status select:not(.dxmppStatusSelect-processed)').addClass('dxmppStatusSelect-processed').bind('change', function() {
      var _new_presence = $(this).val();
      if ((_new_presence != DXMPP_STATUS_UNAVAILABLE) && (Drupal.settings.dxmpp.presence == DXMPP_STATUS_UNAVAILABLE)) {
        Drupal.settings.dxmpp.presence = _new_presence;
        dxmppConnect();
        // We'll set our presence after connecting, as the onConnect behavior
        // will call dxmppSetPresence() after authentication.
        return;
      }

      // Set the new presence.
      Drupal.settings.dxmpp.presence = _new_presence;
      dxmppSetPresence();
    });
  }

  /**
   * Expand the main chat box.
   */
  Drupal.behaviors.dxmppClick = function(context) {
    $('.dxmpp-expand:not(.dxmppClick-processed)', context).addClass('dxmppClick-processed').bind('click', function() {
      $_box = $(this).parents('.dxmpp-box');
      dxmppExpand($_box);

      // Don't pass through the click event.
      return false;
    });
  }

  /**
   * Slides the main content element up.
   */
  dxmppExpand = function($element, forceOpen) {
    var $_visible;

    // Display the main element.
    $element.show();

    if (forceOpen) {
      // We want to force it open when we've selected a user from the roster.
      $element.children('.dxmpp-content').slideDown('slow', dxmppChangeElementTitle);
      _visible = true;
    }
    else {
      // Toggle the visibility.
      $element.children('.dxmpp-content').slideToggle('slow', dxmppChangeElementTitle);
    }

    return false;
  }

  /**
   * Change the title of the roster or chat box accordingly.
   */
  dxmppChangeElementTitle = function() {
    if (Drupal.settings.dxmpp.disable) {
      // Don't change our warning if we aren't able to chat.
      return;
    }

    // Which side are we working on?
    $element = $(this).parent();

    // Is the main section of this area visible?
    var _visible = $element.children('.dxmpp-content').is(':visible');
    if (_visible) {
      // Show the 'expanded' arrow.
      $element.addClass('dxmpp-expanded').removeClass('dxmpp-collapsed');
    }
    else {
      // Show the 'collapsed' icon.
      $element.addClass('dxmpp-collapsed').removeClass('dxmpp-expanded');
    }

    switch ($element.attr('id')) {
      case 'dxmpp-main':
        if (!_visible) {
          // Display the count of online users if we're collapsed.
          dxmppSetMainTitleToCount();
        }
        else {
          // Display our username and any links if we're expanded.
          var $_title = $('.dxmpp-title', $element).html(Drupal.settings.dxmpp.blankTitleSettings);
          $('.dxmpp-icon', $_title).html('<img src="' + Drupal.settings.dxmpp.userIcon + '" height="' + Drupal.settings.dxmpp.iconHeight + '" width="' + Drupal.settings.dxmpp.iconWidth + '" />');
          $('.dxmpp-name', $_title).text(dxmppMainUserName());
          $('.dxmpp-settings-status select', $_title).val(Drupal.settings.dxmpp.presence).change();
          // Bind click event to title.
          Drupal.attachBehaviors($_title.get(0));
        }
        break;
      case 'dxmpp-chatbox':
        // The title of the chat box stays the same whether collapsed or expanded.
        break;
    }
  }

  /**
   * Open a new chatbox when clicking on a user.
   */
  Drupal.behaviors.dxmppUserLink = function(context) {
    if (Drupal.settings.dxmpp.disable) {
      return;
    }
    $('.dxmpp-roster-item-inner-wrapper:not(.dxmppUserLink-processed)', context).addClass('dxmppUserLink-processed', context).bind('click', function() {
      // Grab the user info.
      var user = $(this).parent().data('dxmpp_user');

      dxmppOpenChat(user);

      // Halt further processing.
      return false;
    });

    // Clicking on the tab will open the user's chat.
    $('.ui-tabs-nav a:not(.dxmppUserLink-processed)', context).addClass('dxmppUserLink-processed', context).bind('click', function() {
      // Grab the user info.
      var user = $($(this).attr('href')).data('dxmpp_user');
      dxmppOpenChat(user);
    }).append('<span class="dxmpp-close-tab"></span>').children('.dxmpp-close-tab').bind('click', function() {
      // Clicking on the 'X' on the tab will close the chat.

      // If we're using jQuery Cycle for a tab carousel, we first need to
      // unwrap all our tabs.
      dxmppUnwrapTabs();

      // Grab the user info.
      var user = $($(this).parent('a').attr('href')).data('dxmpp_user');
      var $nav = $(this).parents('.ui-tabs-nav');
      var _selected = $(this).parents('li').hasClass('ui-tabs-selected');
      $(this).parents('li').remove();

      if ($nav.children('li').length == 0) {
        $('#dxmpp-chatbox').slideUp().children('.dxmpp-content').hide();
      }
      else {
        if (_selected) {
          var _new_user = $($('li:first a', $nav).attr('href')).data('dxmpp_user');
          dxmppOpenChat(_new_user);
        }
      }
      dxmppCloseChat(user);

      // If we're using jQuery Cycle for a tab carousel, wrap them up again.
      dxmppWrapTabs();
    });
  }

  dxmppChatIdFromJid = function(jid) {
    return '#dxmpp-chat-' + dxmppJidToId(jid);
  }

  dxmppGetTime = function(_date) {
    if (!_date) {
      _date = new Date();
    }

    var hour   = _date.getHours();
    var minute = _date.getMinutes();
    var ap = "am";
    if (hour   > 11) { ap = "pm";             }
    if (hour   > 12) { hour = hour - 12;      }
    if (hour   == 0) { hour = 12;             }
    if (minute < 10) { minute = "0" + minute; }
    var timeString = hour +
                      ':' +
                      minute +
                      " " +
                      ap;
    return timeString;
  }

  /**
   * Bind the <enter> key with sending the message.
   */
  Drupal.behaviors.dxmppChatInput = function(context) {
    if (Drupal.settings.dxmpp.disable) {
      return;
    }
    $('.dxmpp-chat-input', context).live('keypress', function(event) {
      var jid = $(this).parent().data('jid');
      var user = dxmppUser(jid);
      var fullJid = user.fullJid;

      if (event.which === 13) {
        event.preventDefault();
        var body = $(this).val();

        if (body !== '') {
          var message = $msg({ to: fullJid, 'type': 'chat' }).c('body').t(body).up().c('active', {xmlns: 'http://jabber.org/protocol/chatstates'});
          dxmppConnection.send(message);

          dxmppAddMessage($(this).parent(), jid, body, true);

          $(this).val('');
          $(this).parent().data('composing', false);
        }
        return false;
      }
      else {
        var composing = $(this).parent().data('composing');
        if (!composing) {
          var notify = $msg({to: fullJid, 'type': 'chat'}).c('composing', {xmlns: 'http://jabber.org/protocol/chatstates'});
          dxmppConnection.send(notify);

          $(this).parent().data('composing', true);
        }
      }
    });
  }

  dxmppAddMessage = function($element, jid, body, fromUser) {
	  if (Drupal.settings.dxmpp.use_audio_alerts) {
		  //Right now this will produce audio alerts at whenever a new message is received like in FB
		  $("#dxmpp_jplayer").jPlayer("play");
	  }
	$last = $('.dxmpp-chat-message:last', $element);
    if ($last.length > 0) {
      if ((fromUser && $last.hasClass('dxmpp-me')) || (!fromUser && !$last.hasClass('dxmpp-me'))) {
        _text = Drupal.settings.dxmpp.blankChatText;
        $(_text).text(body).appendTo($('.dxmpp-chat-text', $last));
        dxmppScrollChat(dxmppJidToId(jid));
        $('.dxmpp-chat-text',$last).find('.dxmpp-chat-subtext:last').html(dxmppEmotify($('.dxmpp-chat-text',$last).find('.dxmpp-chat-subtext:last').html()));
        return true;
      }
    }
    if (!$element.data('msg_count')) {
      $element.data('msg_count', 0);
    }
    msg_count = $element.data('msg_count');
    $element.data('msg_count', ++msg_count);

    var _id = 'dxmpp-message-' + dxmppJidToId(jid) + '--' + msg_count;
    _message = Drupal.settings.dxmpp.blankChatMessage;
    $_msg = $(_message).attr('id', _id).appendTo($('.dxmpp-chat-messages', $element));
    if (fromUser) {
      $_msg.addClass('dxmpp-me');
      $('.dxmpp-chat-name', $_msg).text(dxmppMainUserName());
    }
    else {
      $('.dxmpp-chat-name', $_msg).text(dxmppJidToUsername(jid));
    }
    _text = Drupal.settings.dxmpp.blankChatText;
    $('.dxmpp-chat-text', $_msg).html($(_text).text(body));
    $('.dxmpp-chat-time', $_msg).text(dxmppGetTime());
    $('.dxmpp-chat-subtext', $_msg).html(dxmppEmotify($('.dxmpp-chat-subtext',$_msg).html()));
    dxmppScrollChat(dxmppJidToId(jid));
    return true;
  }

  dxmppScrollChat = function(jid_id) {
    var div = $('#dxmpp-chat-' + jid_id + ' .dxmpp-chat-messages').get(0);
    div.scrollTop = div.scrollHeight;
  }

  /**
   * Returns the unique ID for a user, derived from the Drupal $user->uid.
   */
  dxmpp_roster_id = function(jid) {
    return 'dxmpp-roster-id-' + dxmppJidToId(jid);
  }

  /**
   * Add and populate a user roster item.
   */
  dxmpp_add_user_to_roster = function(user) {
    // Create unique ID.
    var _id = dxmpp_roster_id(user.jid);
    var _blank = Drupal.settings.dxmpp.blankRosterItem;

    // Remove any old instances of this user.
    $('#' + _id).remove();

    var $roster = $('#dxmpp-roster ul li');

    var inserted = false;
    if ($roster.length > 0) {
      $roster.each(function() {
        var presence = dxmppPresenceValue($(this));
        var username = $(this).find('.dxmpp-username').text();

        if (user.presence > presence) {
          $(_blank).attr('id', _id).insertBefore($(this));
          inserted = true;
          return false;
        }
        else if ((user.presence == presence) && (user.name < username)) {
          $(_blank).attr('id', _id).insertBefore($(this));
          inserted = true;
          return false;
        }
      });
    }
    if (!inserted) {
      $(_blank).attr('id', _id).appendTo($('#dxmpp-roster ul'));
    }

    var $item = $('#' + _id);

    // Store the user data.
    $item.data('dxmpp_user', user);

    // Add status.
    $item.addClass(dxmppPresenceClass(user.presence));
    // Add username, which will be the Drupal username if available.
    $('.dxmpp-username', $item).text(user.name);

    // Add the user picture, or the default.
    $('.dxmpp-icon', $item).html('<img src="' + user.picture + '" height="' + Drupal.settings.dxmpp.iconHeight + '" width="' + Drupal.settings.dxmpp.iconWidth + '" />');

    // Bind click event to open new chat.
    Drupal.attachBehaviors($item.get(0));

    $('#dxmpp-roster ul li').removeClass('last').removeClass('first');
    $('#dxmpp-roster ul li:first').addClass('first');
    $('#dxmpp-roster ul li:last').addClass('last');

    Drupal.settings.dxmpp.roster[user.jid] = user;
  }

  dxmppGetUserCount = function() {
    var _count = 0;
    for (var user in Drupal.settings.dxmpp.roster) {
      if ((Drupal.settings.dxmpp.roster[user].to_subscribe == 1) && (Drupal.settings.dxmpp.roster[user].presence == DXMPP_STATUS_ONLINE)) {
        _count++;
      }
    }

    return _count;
  }

  dxmppSetMainTitleToCount = function() {
    // Is the main section of this area visible?
    var _visible = $('#dxmpp-main .dxmpp-content').is(':visible');
    if (!_visible) {
      var count = dxmppGetUserCount();
      $('#dxmpp-main .dxmpp-title').html(Drupal.formatPlural(count, Drupal.settings.dxmpp.textFriendsSingular, Drupal.settings.dxmpp.textFriendsPlural));
    }
  }

  /**
   * Get a roster item's status.
   */
  dxmppPresenceValue = function($element) {
    if ($element.hasClass('dxmpp-status-online')) {
      return DXMPP_STATUS_ONLINE;
    }
    else if ($element.hasClass('dxmpp-status-away')) {
      return DXMPP_STATUS_AWAY;
    }
    else if ($element.hasClass('dxmpp-status-invisible')) {
      return DXMPP_STATUS_INVISIBLE;
    }
    return DXMPP_STATUS_UNAVAILABLE;
  }

  dxmppPresenceClass = function(presence) {
    switch (presence) {
      case DXMPP_STATUS_INVISIBLE:
        return 'dxmpp-status-invisible';
      case DXMPP_STATUS_ONLINE:
      case 'online':
        return 'dxmpp-status-online';
      case DXMPP_STATUS_AWAY:
      case 'away':
        return 'dxmpp-status-away';
    }
    return 'dxmpp-status-unavailable';
  }

  /** *******************
   **  Strophe Interface
   ** *******************/

  /**
   * Make our initial connection, which is maintained during the page session.
   */
  dxmppConnect = function() {
    // Set our global connection object.
    var _conn = new Strophe.Connection(Drupal.settings.dxmpp.stropheConnection);

    dxmppDebug(Drupal.settings.dxmpp.jid);
    dxmppDebug(Drupal.settings.dxmpp.sessionID);
    dxmppDebug(Drupal.settings.dxmpp.requestID);

    // Attach an existing session. @TODO
//     _conn.attach(Drupal.settings.dxmpp.jid, Drupal.settings.dxmpp.sessionID, Drupal.settings.dxmpp.requestID);

    // Connect to the appropriate user on the XMPP server.
    _conn.connect(Drupal.settings.dxmpp.jid, Drupal.settings.dxmpp.password, function(status) {
      if (status === Strophe.Status.CONNECTED) {
        // Success!
        $(document).trigger('connected');
      }
      else {
        // We'll try again...
        $(document).trigger('disconnected');
      }
    });

    dxmppConnection = _conn;
  }

  /**
   * Populate the roster when we first make our connection.
   */
  dxmppOnRoster = function(iq) {
    // Add each item of the roster.
    $(iq).find('item').each(function() {
      var jid = $(this).attr('jid');
      var user = dxmppUser(jid);
      if (user.to_subscribe == 1) {
        dxmpp_add_user_to_roster(user);
      }
    });

    dxmppSetMainTitleToCount();

    // Set up the presence handler and send our initial presence.
    dxmppConnection.addHandler(dxmppOnPresence, null, "presence");
    _presence = $pres();
    dxmppDebug('Setting up presence as available...');
    dxmppDebug(_presence);
    dxmppConnection.send(_presence);

    // Handle any subscription/roster changes from Drupal.
    dxmppHandleSubscriptions();
  }

  /**
   * Synchronize our friends list from Drupal with our XMPP roster.
   */
  dxmppHandleSubscriptions = function() {
    var _changed = false;
    var _subscribed = new Array();
    var _unsubscribed = new Array();

    for (var user in Drupal.settings.dxmpp.roster) {
      if ((Drupal.settings.dxmpp.roster[user].to_subscribe == 1) && (Drupal.settings.dxmpp.roster[user].subscribed == 0)) {
        var _jid = Drupal.settings.dxmpp.roster[user].jid;
        dxmppDebug('Adding ' + _jid + ' to roster.');
        var iq = $iq({jid: Drupal.settings.dxmpp.roster[user].jid}).c('set', {xmlns: 'jabber:iq:roster'});
        dxmppConnection.sendIQ(iq);

        dxmppDebug('Sending subscribe to ' + _jid);
        dxmppConnection.send($pres({
          to: _jid,
          'type': 'unsubscribe'
        }));
        dxmppConnection.send($pres({
          to: _jid,
          'type': 'subscribe'
        }));

//         dxmppDebug('Sending subscribed to ' + _jid);
//         dxmppConnection.send($pres({
//           to: Drupal.settings.dxmpp.roster[user].jid,
//           'type': 'subscribed'
//         }));
//         Drupal.settings.dxmpp.roster[user].subscribed = 1;
//         _subscribed.push(Drupal.settings.dxmpp.roster[user].uid);
//         _changed = true;
      }
      else if ((Drupal.settings.dxmpp.roster[user].to_subscribe == 0)) {
        var iq = $iq({jid: Drupal.settings.dxmpp.roster[user].jid, subscription: 'remove'}).c('set', {xmlns: 'jabber:iq:roster'});
//         dxmppConnection.send($pres({
//           to: Drupal.settings.dxmpp.roster[user].jid,
//           'type': 'unsubscribe'
//         }));
        dxmppConnection.send($pres({
          to: Drupal.settings.dxmpp.roster[user].jid,
          'type': 'unsubscribed'
        }));
        Drupal.settings.dxmpp.roster[user].subscribed = 0;
        _unsubscribed.push(Drupal.settings.dxmpp.roster[user].uid);
        _changed = true;
      }
    }

    if (_changed) {
      // Send the revised roster back to Drupal.
      dxmppDebug('Send the revised roster back to Drupal handleSubscriptions.');
      $.ajax({
        type: 'POST',
        url: Drupal.settings.dxmpp.synchRosterURL,
        data: { ajax: true, subscribed: JSON.stringify(_subscribed), unsubscribed: JSON.stringify(_unsubscribed), uid: Drupal.settings.dxmpp.mainUID },
        dataType: 'json',
        success: function (data) {
          if (data.status) {
            // Success.
          }
          else {
            // Failure.
          }
        },
        error: function (xmlhttp) {
          // Failure.
        }
      });
    }
  }

  /**
   * Respond to roster changes, adding & dropping items.
   */
  dxmppOnRosterChange = function(iq) {
    var _fetchNewRoster = false;
    // Remove any deleted roster items.
    $(iq).find('item').each(function() {
      var sub = $(this).attr('subscription');
      var jid = $(this).attr('jid');

      if (sub === 'remove') {
        // Remove the contact.
        $('#' + dxmpp_roster_id(jid)).remove();
      }
      else if (!Drupal.settings.dxmpp.roster[jid]) {
        // The item is not in the roster.
        _fetchNewRoster = true;
      }
    });

    if (_fetchNewRoster) {
      // Send POST request to fetch revised roster.
      dxmppDebug('Send POST request to fetch revised roster onRosterChange.');
      $.ajax({
        type: 'POST',
        url: Drupal.settings.dxmpp.getRosterURL,
        data: { ajax: true },
        dataType: 'json',
        success: function (data) {
          if (data.status) {
            var oldRoster = Drupal.settings.dxmpp.roster;
            Drupal.settings.dxmpp.roster = data.roster;

            // Keep the old presence settings.
            for (var jid in oldRoster) {
              if (Drupal.settings.dxmpp.roster[jid]) {
                Drupal.settings.dxmpp.roster[jid].presence = oldRoster[jid].presence;
              }
            }
            for (var jid in Drupal.settings.dxmpp.roster) {
              // Add or modify the contact.
              dxmpp_add_user_to_roster(dxmppUser(jid));
            }

            // Reset the count of online users.
            dxmppSetMainTitleToCount();
          }
          else {
            // Failure.
          }
        },
        error: function (xmlhttp) {
          // Failure.
        }
      });
    }
    return true;
  }

  /**
   * Respond to XMPP presence events.
   */
  dxmppOnPresence = function(presence) {
    var presenceType = $(presence).attr('type');
    var from = $(presence).attr('from');
    var jid = Strophe.getBareJidFromJid(from);

    dxmppDebug("We've received the following presence status from " + jid);
    dxmppDebug(presence);

    if (presenceType == 'subscribe') {
      dxmppDebug('check to subscribe to ' + jid);
      if ((jid in Drupal.settings.dxmpp.roster) && Drupal.settings.dxmpp.roster[jid].to_subscribe) {
        // We've sent the matching subscribe notification elsewhere.
        // Let's respond to this one so they see us in their roster.
        dxmppConnection.send($pres({
          to: Drupal.settings.dxmpp.roster[jid].jid,
          'type': 'subscribed'
        }));
//         dxmppConnection.send($pres({
//           to: Drupal.settings.dxmpp.roster[user].jid,
//           'type': 'subscribe'
//         }));
        // @TODO: notify Drupal of reciprocation.
        dxmppDebug('sent subscribed to ' + jid);

        if (Drupal.settings.dxmpp.roster[jid].subscribed == '0') {
          dxmppDebug('TODO: send to Drupal');
          Drupal.settings.dxmpp.roster[jid].subscribed = 1;
          var _subscribed = new Array();
          _subscribed.push(Drupal.settings.dxmpp.roster[jid].uid);
          // Send the revised roster back to Drupal.
          dxmppDebug('Send the revised roster back to Drupal onPresence.');
          // @TODO: move this ajax and the one in the other subscribe function
          // into its own function.
          $.ajax({
            type: 'POST',
            url: Drupal.settings.dxmpp.synchRosterURL,
            data: { ajax: true, subscribed: JSON.stringify(_subscribed), uid: Drupal.settings.dxmpp.mainUID },
            dataType: 'json',
            success: function (data) {
              if (data.status) {
                // Success.
              }
              else {
                // Failure.
              }
            },
            error: function (xmlhttp) {
              // Failure.
            }
          });
        }
      }
    }
    else if (presenceType !== 'error') {
      if (jid in Drupal.settings.dxmpp.roster) {
        if (presenceType === 'unavailable') {
          Drupal.settings.dxmpp.roster[jid].presence = DXMPP_STATUS_UNAVAILABLE;
        }
        else {
          var show = $(presence).find('show').text();
          if (show === '' || show === 'chat') {
            Drupal.settings.dxmpp.roster[jid].presence = DXMPP_STATUS_ONLINE;
          }
          else {
            Drupal.settings.dxmpp.roster[jid].presence = DXMPP_STATUS_AWAY;
          }
        }
        // Drop and re-add the old roster item; dynamically resort the roster.
        dxmpp_add_user_to_roster(Drupal.settings.dxmpp.roster[jid]);
        dxmppSetChatTitleContent();

        dxmppSetMainTitleToCount();
      }
      else {
        dxmppDebug(jid + ' is not in the roster.');
      }
    }
    else {
      dxmppDebug('presence error');
    }
    // Ensure we continue to receive and process presence requests.
    return true;
  }

  /**
   * Return the user we are actively chatting with.
   */
  dxmppGetActiveChatUser = function() {
    var _jid = $($('#dxmpp-chatbox .ui-tabs-selected a').attr('href')).data('jid');
    if (_jid && (_jid != dxmppConnection.jid)) {
      return dxmppUser(_jid);
    }
  }

  /**
   * Set the title of our chat box to the active user we're chatting with.
   */
  dxmppSetChatTitleContent = function() {
    var user = dxmppGetActiveChatUser();
    if (user) {
      var _title = $('#dxmpp-chatbox .dxmpp-title').html(Drupal.settings.dxmpp.blankChatboxTitle).addClass('dxmpp-status-available');
      $('.dxmpp-icon', _title).html('<img src="' + user.picture + '" height="' + Drupal.settings.dxmpp.iconHeight + '" width="' + Drupal.settings.dxmpp.iconWidth + '" />');
      $('.dxmpp-name', _title).text(user.name);
      $('.dxmpp-title-status', _title).text(Drupal.settings.dxmpp.statusText[user.presence]);
    }
  }

  /**
   * Remove the chat box w/ the messages of the specified user.
   */
  dxmppCloseChat = function(user) {
    var chat_id = dxmppChatIdFromJid(user.jid);
    $(chat_id).remove();
  }

  dxmppOpenChat = function(user) {
    // Epand the chat box.
    dxmppExpand($('#dxmpp-chatbox'), true);

    var jid = user.jid;
    var name = user.name;

    var chat_id = dxmppChatIdFromJid(jid);

    // Select or add the chat tab.
    if ($(chat_id).length > 0) {
      $('#dxmpp-chatbox .dxmpp-content').tabs('select', chat_id);
    }
    else {
      $('#dxmpp-chatbox .dxmpp-content').tabs('add', chat_id, name).tabs('select', chat_id);
      $(chat_id).append(Drupal.settings.dxmpp.blankChatbox);
      $(chat_id).data('dxmpp_user', user);
      $(chat_id).data('jid', jid);

      // Bind the click event to the new tab.
      Drupal.attachBehaviors($('#dxmpp-chatbox').get(0));
    }

    // Switch the focus to the correct chatbox tab.
    $('textarea', chat_id).focus();

    // Set the main title to display icon & username.
    dxmppSetChatTitleContent();

    // Cycle to the correct tab if using jQuery Cycle.
    dxmppUnwrapTabs();
    dxmppWrapTabs(chat_id);

    return true;
  }

  dxmppSetFullJid = function(fullJid) {
    var jid = Strophe.getBareJidFromJid(fullJid);
    if (Drupal.settings.dxmpp.roster[jid]) {
      Drupal.settings.dxmpp.roster[jid].fullJid = fullJid;
    }
  }

  dxmppOnMessage = function(message) {
    var fullJid = $(message).attr('from');
    dxmppSetFullJid(fullJid);

    var jid = Strophe.getBareJidFromJid(fullJid);
    var name = dxmppJidToUsername(jid);

    var user = dxmppUser(jid);

    var composing = $(message).find('composing');
    var _chat_id = dxmppChatIdFromJid(jid);
    if (Drupal.settings.dxmpp.displayTypingMessage && (composing.length > 0) && $(_chat_id).length) {
      // Open the chat for this user.
      dxmppOpenChat(user);

      var _params = { '@name': user.name };
      $('.dxmpp-chat-events', _chat_id).text(Drupal.t('@name is typing...', _params));
    }

    // First look for an HTML encoded body.
    var body = $(message).find("html > body");

    if (body.length === 0) {
      // This is not an HTML encoded body. Look for a plain text body.
      body = $(message).find('body');
      if (body.length > 0) {
        // The text is our body.
        body = body.text();
      }
      else {
        // This is a blank message.
        body = null;
      }
    }
    else {
      body = body.contents();

      var span = $("<span></span");
      body.each(function() {
        if (document.importNode) {
          $(document.importNode(this, true)).appendTo(span);
        }
        else {
          // IE workaround.
          span.append(this.xml);
        }
      });

      body = span;
    }

    if (body) {
      // Open the chat for this user.
      dxmppOpenChat(user);

      $('.dxmpp-chat-events', dxmppChatIdFromJid(jid)).text('');
      // Add the new message.
      dxmppAddMessage($(dxmppChatIdFromJid(jid)), jid, body, false);
    }

    // We need to continue processing future messages.
    return true;
  }

  /**
   * Return either the user object from settings, or create a new one.
   *
   * @param jid
   *   The full jid of the desired user.
   */
  dxmppUser = function(jid) {
    if (Drupal.settings.dxmpp.roster[jid]) {
      return Drupal.settings.dxmpp.roster[jid];
    }
    var user = {
      name: dxmppJidToUsername(jid),        // The name to display.
      jid: jid,                             // The bare jid.
      fullJid: jid,                        // The full XMPP user ID.
      uid: jid,                             // The Drupal uid.
      picture: Drupal.settings.dxmpp.defaultPicture, // The default user picture.
      presence: DXMPP_STATUS_UNAVAILABLE,   // The jabber presence status.
      dversion: 0                           // Which version of Drupal data.
    };
    return user;
  }

  /**
   * Convert the characters of an XMPP/Jabber ID to those suitable for a CSS id.
   */
  dxmppJidToId = function(jid) {
    if (jid) {
      return Strophe.getBareJidFromJid(jid).replace(/@/g, '-').replace(/\./g, '-');
    }
  }

  /**
   * Return just the username portion of the full XMPP ID.
   */
  dxmppJidToUsername = function(jid) {
    return Strophe.getNodeFromJid(jid);
  }

  /**
   * Return the XMPP username of the logged in user.
   */
  dxmppMainUserName = function() {
    return Drupal.settings.dxmpp.mainUserName;
    return dxmppJidToUsername(dxmppConnection.jid);
  }

  /**
   * Initialize chat area.
   */
  Drupal.behaviors.dxmppInitializeChatArea = function(context) {
    if (Drupal.settings.dxmpp.disable) {
      return;
    }
    // Initialize tabs and make them sortable.
    $('#dxmpp-chatbox .dxmpp-content:not(.dxmppInitializeChatArea-processed)', context).addClass('dxmppInitializeChatArea-processed').tabs().find('.ui-tabs-nav').sortable({axis: 'x'});

    if (Drupal.settings.dxmpp.useJqueryCycle) {
      $('#dxmpp-chatbox .dxmpp-content .ui-tabs-nav:not(.dxmppAddJqueryCycle-processed)', context).addClass('dxmppAddJqueryCycle-processed').parent().prepend('<div id="dxmpp-cycle-tab-prev" />').append('<div id="dxmpp-cycle-tab-next" />');
      dxmppUnwrapTabs();
      dxmppWrapTabs();
    }
  }

  /**
   * Unwrap the carousel from the tabs.
   */
  dxmppUnwrapTabs = function() {
    if (Drupal.settings.dxmpp.useJqueryCycle) {
      $ui = $('#dxmpp-chatbox .ui-tabs-nav');
      $('.cycle-wrapper', $ui).children('li').unwrap();
    }
  }

  /**
   * We wrap our tabs in groups so they'll work with jQuery Cycle.
   */
  dxmppWrapTabs = function(_selected) {
    if (Drupal.settings.dxmpp.useJqueryCycle) {
      var _count = 0;
      var _start = 0;
      $ui = $('#dxmpp-chatbox .ui-tabs-nav');
      while ($ui.children('li').length) {
        // We need to wrap our tabs in groups for the carousel to work.
        $ui.children('li').slice(0, Drupal.settings.dxmpp.numberOfTabsInCycle).wrapAll('<div id="cycle-wrapper-' + (++_count) + '" class="cycle-wrapper" />');
        if (_selected) {
          if ($('a:[href=' + _selected + ']', $('#cycle-wrapper-' + _count)).length) {
            _start = _count;
          }
        }
      }
      if (_start) {
        // Cycle starts at 0.
        _start--;
      }
      if ($ui.children('.cycle-wrapper').length) {
        // Add a 'carousel' to the tabs.
        $ui.cycle({
          fx:     'none',
          nowrap: 0,
          startingSlide: _start,
          prev:   '#dxmpp-cycle-tab-prev',
          next:   '#dxmpp-cycle-tab-next'
        }).cycle('pause');
      }
    }
  }

  Strophe.log = function (level, msg) {
    if (level) {
      dxmppDebug('Strophe: ' + level + ' - "' + msg + '"');
    }
  };

  dxmppDebug = function(msg) {
    // Don't crash the ie folks...
    if (window.console && console.log) {
      console.log(msg);
    }
//     else {
//       if (!$('#dxmpp-log').length) {
//         $('body').append('<div id="dxmpp-log" />');
//       }
//       $('#dxmpp-log').append('<p>' + msg + '</p>');
//     }
  }


//   dxmppConnectionSend = function(_send) {
//     dxmppConnection.send(_send);
//   }

})(jQuery);
$(document).ready(function() {
	
	//Audio setup
	if (Drupal.settings.dxmpp.use_audio_alerts) {
		$("#dxmpp_jplayer").jPlayer( {
			ready: function () {
			this.element.jPlayer("setFile",Drupal.settings.dxmpp.mp3_filepath); // Defines the mp3
	    	},
	    	swfPath: Drupal.settings.dxmpp.swfpath
		});
	}
	var dxmppSmileys = { /*
		    smiley     image_url          title_text              alt_smilies           */
		    ":)":    [ "1.gif",           "happy",                ":-)"                 ],
		    ":(":    [ "2.gif",           "sad",                  ":-("                 ],
		    ";)":    [ "3.gif",           "winking",              ";-)"                 ],
		    ":D":    [ "4.gif",           "big grin",             ":-D"                 ],
		    ";;)":   [ "5.gif",           "batting eyelashes"                           ],
		    ">:D<":  [ "6.gif",           "big hug"                                     ],
		    ":-/":   [ "7.gif",           "confused",             ":/"                  ],
		    ":x":    [ "8.gif",           "love struck",          ":X"                  ],
		    ":\">":  [ "9.gif",           "blushing"                                    ],
		    ":P":    [ "10.gif",          "tongue",               ":p", ":-p", ":-P"    ],
		    ":-*":   [ "11.gif",          "kiss",                 ":*"                  ],
		    "=((":   [ "12.gif",          "broken heart"                                ],
		    ":-O":   [ "13.gif",          "surprise",             ":O"                  ],
		    "X(":    [ "14.gif",          "angry"                                       ],
		    ":>":    [ "15.gif",          "smug"                                        ],
		    "B-)":   [ "16.gif",          "cool"                                        ],
		    ":-S":   [ "17.gif",          "worried"                                     ],
		    "#:-S":  [ "18.gif",          "whew!",                "#:-s"                ],
		    ">:)":   [ "19.gif",          "devil",                ">:-)"                ],
		    ":((":   [ "20.gif",          "crying",               ":-((", ":'(", ":'-(" ],
		    ":))":   [ "21.gif",          "laughing",             ":-))"                ],
		    ":|":    [ "22.gif",          "straight face",        ":-|"                 ],
		    "/:)":   [ "23.gif",          "raised eyebrow",       "/:-)"                ],
		    "=))":   [ "24.gif",          "rolling on the floor"                        ],
		    "O:-)":  [ "25.gif",          "angel",                "O:)"                 ],
		    ":-B":   [ "26.gif",          "nerd"                                        ],
		    "=;":    [ "27.gif",          "talk to the hand"                            ],
		    "I-)":   [ "28.gif",          "sleepy"                                      ],
		    "8-|":   [ "29.gif",          "rolling eyes"                                ],
		    "L-)":   [ "30.gif",          "loser"                                       ],
		    ":-&":   [ "31.gif",          "sick"                                        ],
		    ":-$":   [ "32.gif",          "don't tell anyone"                           ],
		    "[-(":   [ "33.gif",          "not talking"                                 ],
		    ":O)":   [ "34.gif",          "clown"                                       ],
		    "8-}":   [ "35.gif",          "silly"                                       ],
		    "<:-P":  [ "36.gif",          "party",                "<:-p"                ],
		    "(:|":   [ "37.gif",          "yawn"                                        ],
		    "=P~":   [ "38.gif",          "drooling"                                    ],
		    ":-?":   [ "39.gif",          "thinking"                                    ],
		    "#-o":   [ "40.gif",          "d'oh",                 "#-O"                 ],
		    "=D>":   [ "41.gif",          "applause"                                    ],
		    ":-SS":  [ "42.gif",          "nailbiting",           ":-ss"                ],
		    "@-)":   [ "43.gif",          "hypnotized"                                  ],
		    ":^o":   [ "44.gif",          "liar"                                        ],
		    ":-w":   [ "45.gif",          "waiting",              ":-W"                 ],
		    ":-<":   [ "46.gif",          "sigh"                                        ],
		    ">:P":   [ "47.gif",          "phbbbbt",              ">:p"                 ],
		    ":@)":   [ "49.gif",          "pig"                                         ]
	};
	//Load smileys.
	dxmppEmotify.emoticons( Drupal.settings.dxmpp.smiley_url, dxmppSmileys );
});