
/**
 * @file
 * Define the baseline Drupal behaviors for the dxmpp_muc module.
 */
var dxmpp_muc = {
    connection: null,
    room: null,
    nickname: null,
    room_name: null,
    NS_MUC: "http://jabber.org/protocol/muc",

    joined: null,
    participants: null,

    on_presence: function (presence) {
        var from = $(presence).attr('from');
        var room = Strophe.getBareJidFromJid(from);
        
        // make sure this presence is for the right room
        if (room === dxmpp_muc.room) {
            var nick = Strophe.getResourceFromJid(from);
          
            if ($(presence).attr('type') === 'error' &&
                !dxmpp_muc.joined) {
                // error joining room; reset app
                dxmpp_muc.connection.disconnect();
            } else if (!dxmpp_muc.participants[nick] &&
                $(presence).attr('type') !== 'unavailable') {
                // add to participant list
                var user_jid = $(presence).find('item').attr('jid');
                dxmpp_muc.participants[nick] = user_jid || true;
                $('#dxmpp_muc-participant-list').append('<li>' + nick + '</li>');

                if (dxmpp_muc.joined) {
                    $(document).trigger('dxmpp_muc-user_joined', nick);
                }
            } else if (dxmpp_muc.participants[nick] &&
                       $(presence).attr('type') === 'unavailable') {
                // remove from participants list
                $('#dxmpp_muc-participant-list li').each(function () {
                    if (nick === $(this).text()) {
                        $(this).remove();
                        return false;
                    }
                });

                $(document).trigger('dxmpp_muc-user_left', nick);
            }

            if ($(presence).attr('type') !== 'error' && 
                !dxmpp_muc.joined) {
            	$('#testing').append(' Room_joined ');
                    $(document).trigger('dxmpp_muc-room_joined');
					
                // check for status 110 to see if it's our own presence
                if ($(presence).find("status[code='110']").length > 0) {
                    // check if server changed our nick
                    if ($(presence).find("status[code='210']").length > 0) {
                        dxmpp_muc.nickname = Strophe.getResourceFromJid(from);
                    }

                    // room join complete
					
                }
            }
        }

        return true;
    },

    on_public_message: function (message) {
        var from = $(message).attr('from');
        var room = Strophe.getBareJidFromJid(from);
        var nick = Strophe.getResourceFromJid(from);

        // make sure message is from the right place
        if (room === dxmpp_muc.room) {
            // is message from a user or the room itself?
            var notice = !nick;

            // messages from ourself will be styled differently
            var nick_class = "dxmpp_muc-nick";
            if (nick === dxmpp_muc.nickname) {
                nick_class += " dxmpp_muc-self";
            }
            
            var body = dxmppEmotify($(message).children('body').text());
            
            var delayed = $(message).children("delay").length > 0  ||
                $(message).children("x[xmlns='jabber:x:delay']").length > 0;

            // look for room topic change
            var subject = $(message).children('subject').text();
            if (subject) {
                $('#dxmpp_muc-room-topic').text(subject);
            }

            if (!notice) {
                var delay_css = delayed ? " dxmpp_muc-delayed" : "";

                var action = body.match(/\/me (.*)$/);
                if (!action) {
                    dxmpp_muc.add_message(
                        "<div class='dxmpp_muc-message" + delay_css + "'>" +
                            "&lt;<span class='" + nick_class + "'>" +
                            nick + "</span>&gt; <span class='dxmpp_muc-body'>" +
                            body + "</span></div>");
                } else {
                    dxmpp_muc.add_message(
                        "<div class='dxmpp_muc-message dxmpp_muc-action " + delay_css + "'>" +
                            "* " + nick + " " + action[1] + "</div>");
                }
            } else {
                dxmpp_muc.add_message("<div class='dxmpp_muc-notice'>*** " + body +
                                    "</div>");
            }
        }

        return true;
    },

    add_message: function (msg) {
        // detect if we are scrolled all the way down
        var chat = $('#dxmpp_muc-chat').get(0);
        var at_bottom = chat.scrollTop >= chat.scrollHeight - 
            chat.clientHeight;
        
        $('#dxmpp_muc-chat').append(msg);

        // if we were at the bottom, keep us at the bottom
        if (at_bottom) {
            chat.scrollTop = chat.scrollHeight;
        }
    },

    on_private_message: function (message) {
        var from = $(message).attr('from');
        var room = Strophe.getBareJidFromJid(from);
        var nick = Strophe.getResourceFromJid(from);

        // make sure this message is from the correct room
        if (room === dxmpp_muc.room) {
            var body = $(message).children('body').text();
            dxmpp_muc.add_message("<div class='dxmpp_muc-message dxmpp_muc-private'>" +
                                "@@ &lt;<span class='dxmpp_muc-nick'>" +
                                nick + "</span>&gt; <span class='dxmpp_muc-body'>" +
                                body + "</span> @@</div>");
            
        }

        return true;
    }
};

$(document).ready(function () {
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
	$('#dxmpp_muc-room-topic').html('Current Topic has not been set yet.');
	$('#dxmpp_muc-room-name').html('Loading...');
	$('#dxmpp_muc-room-topic').slideUp();
	$('#dxmpp_muc-chat-body').slideUp();
	
	$('#dxmpp_muc-room-name').click(function () {
		$('#dxmpp_muc-room-topic').slideToggle();
		$('#dxmpp_muc-chat-body').slideToggle();
		//$('#dxmpp_muc-input').slideToggle();
	
	});
	$(document).trigger('dxmpp_muc-connect', {
        jid: Drupal.settings.dxmpp.jid,
        password: Drupal.settings.dxmpp.password
    });

    $('#dxmpp_muc-leave').click(function () {
        $('#dxmpp_muc-leave').attr('disabled', 'disabled');
        dxmpp_muc.connection.send(
            $pres({to: dxmpp_muc.room + "/" + dxmpp_muc.nickname,
                   type: "unavailable"}));
        dxmpp_muc.connection.disconnect();
    });

    $('#dxmpp_muc-input').keypress(function (ev) {
        if (ev.which === 13) {
            ev.preventDefault();

            var body = $(this).val();

            var match = body.match(/^\/(.*?)(?: (.*))?$/);
            var args = null;
            if (match) {
                if (match[1] === "msg") {
                    args = match[2].match(/^(.*?) (.*)$/);
                    if (dxmpp_muc.participants[args[1]]) {
                        dxmpp_muc.connection.send(
                            $msg({
                                to: dxmpp_muc.room + "/" + args[1],
                                type: "chat"}).c('body').t(body));
                        dxmpp_muc.add_message(
                            "<div class='dxmpp_muc-message dxmpp_muc-private'>" +
                                "@@ &lt;<span class='dxmpp_muc-nick dxmpp_muc-self'>" +
                                dxmpp_muc.nickname + 
                                "</span>&gt; <span class='dxmpp_muc-body'>" +
                                args[2] + "</span> @@</div>");
                    } else {
                        dxmpp_muc.add_message(
                            "<div class='dxmpp_muc-notice dxmpp_muc-error'>" +
                                "Error: User not in room." +
                                "</div>");
                    }
                } else if (match[1] === "me" || match[1] === "action") {
                    dxmpp_muc.connection.send(
                        $msg({
                            to: dxmpp_muc.room,
                            type: "groupchat"}).c('body')
                            .t('/me ' + match[2]));
                } else if (match[1] === "topic") {
                    dxmpp_muc.connection.send(
                        $msg({to: dxmpp_muc.room,
                              type: "groupchat"}).c('subject')
                            .t('Current topic - ' + match[2]));
                } else if (match[1] === "kick") {
                    dxmpp_muc.connection.sendIQ(
                        $iq({to: dxmpp_muc.room,
                             type: "set"})
                            .c('query', {xmlns: dxmpp_muc.NS_MUC + "#admin"})
                            .c('item', {nick: match[2],
                                        role: "none"}));
                } else if (match[1] === "ban") {
                    dxmpp_muc.connection.sendIQ(
                        $iq({to: dxmpp_muc.room,
                             type: "set"})
                            .c('query', {xmlns: dxmpp_muc.NS_MUC + "#admin"})
                            .c('item', {jid: dxmpp_muc.participants[match[2]],
                                        affiliation: "outcast"}));
                } else if (match[1] === "op") {
                    dxmpp_muc.connection.sendIQ(
                        $iq({to: dxmpp_muc.room,
                             type: "set"})
                            .c('query', {xmlns: dxmpp_muc.NS_MUC + "#admin"})
                            .c('item', {jid: dxmpp_muc.participants[match[2]],
                                        affiliation: "admin"}));
                } else if (match[1] === "deop") {
                    dxmpp_muc.connection.sendIQ(
                        $iq({to: dxmpp_muc.room,
                             type: "set"})
                            .c('query', {xmlns: dxmpp_muc.NS_MUC + "#admin"})
                            .c('item', {jid: dxmpp_muc.participants[match[2]],
                                        affiliation: "none"}));
                } else {
                    dxmpp_muc.add_message(
                        "<div class='dxmpp_muc-notice dxmpp_muc-error'>" +
                            "Error: Command not recognized." +
                            "</div>");
                }
            } else {
                dxmpp_muc.connection.send(
                    $msg({
                        to: dxmpp_muc.room,
                        type: "groupchat"}).c('body').t(body));
            }

            $(this).val('');
        }
    });
});

$(document).bind('dxmpp_muc-connect', function (ev, data) {
    $('#testing').append(' Room -  ' + dxmpp_muc.room);
    $('#testing').append(' Jid -  ' + Drupal.settings.dxmpp.jid);
    $('#testing').append(' Password -  ' + Drupal.settings.dxmpp.password);
    //data.jid = Drupal.settings.dxmpp.jid;
    //data.password = Drupal.settings.dxmpp.password;
    dxmpp_muc.nickname = Drupal.settings.dxmpp.mainUserName;
    dxmpp_muc.room = Drupal.settings.dxmpp_muc.room_name;
	dxmpp_muc.room_name = dxmpp_muc.room;
    dxmpp_muc.connection = new Strophe.Connection(
        Drupal.settings.dxmpp_muc.server_url);
        
    //if(Drupal.settings.dxmpp.sessionID == null) {
    dxmpp_muc.connection.connect(
        data.jid, data.password,
        function (status) {
            if (status === Strophe.Status.CONNECTED) {
                $(document).trigger('dxmpp_muc-connected');
            } else if (status === Strophe.Status.DISCONNECTED) {
                $(document).trigger('dxmpp_muc-disconnected');
            }
        });
    /*}
    else {
    	dxmpp_muc.connection.attach(Drupal.settings.dxmpp.jid, Drupal.settings.dxmpp.sessionID, Drupal.settings.dxmpp.requestID, function () {dxmppDebug('1');$(document).trigger('dxmpp_muc-connected');});
    }*/
});

$(document).bind('dxmpp_muc-connected', function () {
    
	dxmpp_muc.joined = false;
	 
    dxmpp_muc.participants = {};
     
    dxmpp_muc.connection.send($pres().c('priority').t('-1'));
    dxmpp_muc.room = dxmpp_muc.room + "@" + Drupal.settings.dxmpp_muc.subdomain_name + "." + Drupal.settings.dxmpp_muc.domain_name;
	 
    dxmpp_muc.connection.addHandler(dxmpp_muc.on_presence,
                                  null, "presence");
    dxmpp_muc.connection.addHandler(dxmpp_muc.on_public_message,
                                  null, "message", "groupchat");
    dxmpp_muc.connection.addHandler(dxmpp_muc.on_private_message,
                                  null, "message", "chat");
    

		
    dxmpp_muc.connection.send(
        $pres({
            to: dxmpp_muc.room + "/" + dxmpp_muc.nickname
        }).c('x', {xmlns: dxmpp_muc.NS_MUC}));
});

$(document).bind('dxmpp_muc-disconnected', function () {
    dxmpp_muc.connection = null;
    
    $('#dxmpp_muc-room-topic').empty();
    $('#dxmpp_muc-participant-list').empty();
    $('#dxmpp_muc-chat').empty();
    
    $(document).trigger('dxmpp_muc-connect', {
        jid: Drupal.settings.dxmpp.jid,
        password: Drupal.settings.dxmpp.password
    });
});

$(document).bind('dxmpp_muc-room_joined', function () {
    dxmpp_muc.joined = true;

    $('#dxmpp_muc-leave').removeAttr('disabled');
    $('#dxmpp_muc-room-name').text(dxmpp_muc.room_name);

    dxmpp_muc.add_message("<div class='dxmpp_muc-notice'>*** Room joined.</div>")
});

$(document).bind('dxmpp_muc-user_joined', function (ev, nick) {
    dxmpp_muc.add_message("<div class='dxmpp_muc-notice'>*** " + nick +
                         " joined.</div>");
});

$(document).bind('dxmpp_muc-user_left', function (ev, nick) {
    dxmpp_muc.add_message("<div class='dxmpp_muc-notice'>*** " + nick +
                        " left.</div>");
});
