<div align="center" style="text-align: center; margin-bottom: 50px">
<img src="images/logo.png" alt="JS Client JS Logo" align="center" width="100">
<h1>AMP Client JS</h1>
<h2 align="center">GTM Metrics Guide</h2>
</div>

To send events to GA via GTM, you need to configure variables, triggers and tags.
We should start by setting the tag "Google Analytics: GA4 Configuration".

<img src="./images/gtm.ga4-configuration-tag.png" alt="Google Analytics: GA4 Configuration" width="600">

Now go to the "Variables" tab and declare all the variables that are passed to the metric events. All variables are of type "DataLayer variable".

<img src="./images/gtm.varibles.png" alt="GTM Variables" width="600">

Then you have to set the triggers. Let's go to the "Triggers" tab and define the following four triggers:

<img src="./images/gtm.amp-banner-loaded-trigger.png" alt="AMP Banner Loaded Trigger" width="600">
<img src="./images/gtm.amp-banner-displayed-trigger.png" alt="AMP Banner Displayed Trigger" width="600">
<img src="./images/gtm.amp-banner-fully-displayed-trigger.png" alt="AMP Banner Fully Displayed Trigger" width="600">
<img src="./images/gtm.amp-banner-clicked.png" alt="AMP Banner Clicked Trigger" width="600">

Now we can finally set the tags for all four events.

<img src="./images/gtm.amp-banner-loaded-tag.png" alt="AMP Banner Loaded Tag" width="600">
<img src="./images/gtm.amp-banner-displayed-tag.png" alt="AMP Banner Displayed Tag" width="600">
<img src="./images/gtm.amp-banner-fully-displayed-tag.png" alt="AMP Banner Fully Displayed Tag" width="600">
<img src="./images/gtm.amp-banner-clicked-tag.png" alt="AMP Banner Clicked Tag" width="600">

That's all, sending events through GTM should work now.
