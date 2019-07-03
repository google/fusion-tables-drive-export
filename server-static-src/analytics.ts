/**
 * Google Analytics
 */
var $googleTagmanagerScript = document.createElement('script');
$googleTagmanagerScript.type = 'text/javascript';
$googleTagmanagerScript.async = true;
$googleTagmanagerScript.src =
  `https://www.googletagmanager.com/gtag/js?id=${process.env.GOOGLE_ANALYTICS_KEY}`;
document.head.appendChild($googleTagmanagerScript);

window.dataLayer = window.dataLayer || [];
window.gtag = function() {
  window.dataLayer.push(arguments);
};
window.gtag('js', new Date());
window.gtag('config', process.env.GOOGLE_ANALYTICS_KEY);
