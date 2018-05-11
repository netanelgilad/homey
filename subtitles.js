
const opensubtitles = require('subtitler')
opensubtitles.api.login()
.then(function(token){
	// got the auth token
  opensubtitles.api.searchForFile(token, "en", "/Users/netanelgilad/Development/homey/Rick.and.Morty.S02E03.Auto.Erotic.Assimilation.WEBRip.AAC2.0.H.264-RARBG/Rick.and.Morty.S02E03.Auto.Erotic.Assimilation.WEBRip.AAC2.0.H.264-RARBG.mkv")
.then(function(results) {
	//got the search results
  console.log(results);
});

});

// PirateBay.search('fear the walking dead s04e02', {
//   category: 'video'
// })
// .then(results => console.log(results[0]))
// .catch(err => console.log(err))