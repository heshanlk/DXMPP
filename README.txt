
DXMPP creates a themeable browser chat client for an XMPP server.

Before installing DXMPP module you need to setup an XMPP server. 
Follow this guide(http://groups.drupal.org/node/59163) on how to setup an XMPP
for use with Drupal if you haven't done so already.

Installation
============
- Copy the DXMPP module folder(dxmpp) to your module directory and then enable 
  the module on the admin modules page.
- Download the latest stable release of the Strophe library
  (http://code.stanziq.com/strophe/) and extract the entire folder into 
  sites/all/libraries.
- If you don't have a reverse proxy to the XMPP Server, download the latest 
  stable release of the flXHR library(http://flxhr.flensed.com/) and extract
  the entire folder into sites/all/libraries.
- Go to DXMPP settings page(admin/settings/dxmpp) and enter the XMPP Server 
  domain & XMPP BOSH URL of your XMPP server. Enable flXHR, if required. You 
  may also wish to change other settings. After you have done so save your 
  settings.
- Setup the correct DXMPP permissions for authenticated users.
- Enable DMPP Chat block from the admin block page. Thats it!
