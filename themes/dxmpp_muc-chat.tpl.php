<?php

  /**
   * @file
   * Template file for theme_dxmpp_muc_chat().
   *
   */
drupal_add_js(
	array('dxmpp_muc' =>
		array("room_name" => variable_get('dxmpp_muc_room_name','My_Room'),
			  "domain_name" => dxmpp_variable_get('domain'),
			  "server_url" => dxmpp_variable_get('server'),
			  "subdomain_name" => variable_get('dxmpp_muc_subdomain_name','conference'),
		)), 'setting');
?>


    <div id='dxmpp_muc-toolbar'>
      <input id='dxmpp_muc-leave' type='button' value='Leave Room'
             disabled='disabled' class='dxmpp_muc-hidden'>
    </div>

    <div>
      <div id='dxmpp_muc-chat-area'>
        <div>
          <div id='dxmpp_muc-room-name'></div>
          <div id='dxmpp_muc-room-topic'></div>
        </div>
        <div id='dxmpp_muc-chat-body'>
        <div id='dxmpp_muc-chat'>
        </div>

        <textarea id='dxmpp_muc-input'></textarea>
        </div>
      </div>
    
      <div id='dxmpp_muc-participants' class='dxmpp_muc-hidden'>
        <ul id='dxmpp_muc-participant-list'>
        </ul>
      </div>
    </div>
    <div id='testing' class='dxmpp_muc-hidden'></div>
    
	