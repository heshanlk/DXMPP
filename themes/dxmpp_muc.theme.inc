<?php
function template_preprocess_dxmpp_muc_chat(&$variables) {

drupal_add_css(drupal_get_path('module', 'dxmpp_muc') .'/themes/dxmpp_muc.css');
//$variables['css']        = drupal_add_css();
//$variables['styles']     = drupal_get_css();
drupal_add_js(drupal_get_path('module', 'dxmpp_muc') .'/themes/js/dxmpp_muc.js');
jquery_ui_add('jquery.ui.core');
jquery_ui_add('jquery.ui.widget');
jquery_ui_add('jquery.ui.mouse');
jquery_ui_add('jquery.ui.tabs');
jquery_ui_add('jquery.ui.sortable');
}
