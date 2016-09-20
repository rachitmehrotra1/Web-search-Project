

//Rachit Mehrotra
//rm4149@nyu.edu


function callSolr() {
	// We tried to work with solr and had the whole solr backend setup and working , but as the NY Times Corpus was paid
	// and not avaialable to us even through Bobst Library accounts , we didn't use it in the final project, but if the dataset is given
	// even the solr part works perfectly with indexing , and getting results through solr collections of news ,
	// news is parsed and stored in solr by a java indexer with reads the meta tags from corpus and stores the news accordingly
	var solrApi = "http://localhost:8983/solr/newscollection/select";//?q=";
	sentences[0] = "";
	$("#results").empty();
	$.ajax({
		  'url': solrApi,
		  'data': {'wt':'json', 'q': $("input").val()},
		  'success': function(data) { 
					$("#result").empty();
					$.each(data.response.docs, function(i, doc){
						var html = '<li> Date: ' + this.NEWSDATE + '</br><hr>';
						html += ' Place: '+ this.PLACE + '</br><hr>';;
						html += ' <b>TITLE: ' + this.TITLE + '</b>'+ '</br><hr>';
						html += ' Content: ' + this.CONTENT + '</br><hr>';
						html += ' <a href=\"' + this.CATEGORY + '\">Category</a></li></br></br>';
						$("#results").append(html);
						sentences.push(this.TITLE + " " + this.CONTENT);
						
					});
					topicise();
		  },
		  'dataType': 'jsonp',
		  'jsonp': 'json.wrf'
		});

}

function crawlNYTimes(y,z) {
	var NYTApi = "http://api.nytimes.com/svc/search/v2/articlesearch.json?q=";
	NYTApi = NYTApi + y + "&sort=newest&api-key=3a9948f7410b6bd9138716c33ff4ed75:1:75166459";
		// alert("Value for NY times crawler is"+ y + " int var "+ z);
	$('#results').append('</br>');
	$.getJSON(NYTApi).
		done(function(data) {
			// $("#results").empty();
			var i=0;
			// alert("Value of I-->"+i+"  Value of z"+z);
			$.each(data.response.docs, function(i, doc){
				// alert("news is->"+this.section_name+" i is "+i + " docs is "+doc);
				
				var html = '<div id=\"div' + (i+z) +'\"><li id = li' + i++ + '> Date: ' + this.pub_date + '</br><hr>';
				html += ' Abstract: '+ this.section_name + '</br><hr>';;
				html += ' <b>Headlines: ' + this.headline.main + '</b>'+ '</br><hr>';
				html += ' Author: ' + this.byline.original + '</br><hr>';
				html += ' <a href=\"' + this.web_url + '\">Click here</a></li></div>';
				
				$("#results").append(html);
				var sentc = this.headline.main + " " + this.section_name;
				sentences.push(sentc);
				// sentences[0] = sentences[0].concat(this.headline.main, " ");
				// sentences[0] = sentences[0].concat(this.abstract, " ");
			});
			// alert("Calling topicise 0");
			topicise(0);
		});
}



function crawlGuardian(x) {
	document.getElementById("searchf").value=x;
	var GApi = "http://content.guardianapis.com/search?q=";

	GApi = GApi + x + "&order-by=newest&api-key=neukrcw8u9xm4ks5zejvx3uj&show-tags=contributor";

	
	$.getJSON( GApi, function( data ) {
			$("#results").empty();
			 $("#results").append('<hr><br /> <br />');
			sentences = [];
			var i=0;
			$.each(data.response.results, function(){
				var html = '<div id=\"div' + i +'\"><li id = li' + i++ + '> Date: ' + this.webPublicationDate + '</br><hr>';
				html += ' Abstract: '+ this.sectionName + '</br><hr>';;
				html += ' <b>Headlines: ' + this.webTitle + '</b>'+ '</br><hr>';
				if(this.tags.length>0)
				html += ' Author: ' + this.tags[0].webTitle + '</br><hr>';
				else
				html += ' Author: ' + 'not avaialable' + '</br><hr>';	
				html += ' <a href=\"' + this.webUrl + '\">Click here</a></li></div>';
				$("#results").append(html);

				var sentc = this.webTitle + " " + this.sectionName;
				
				sentences.push(sentc);
//				sentences[0] = sentences[0].concat(this.webTitle, " ");
//				sentences[0] = sentences[0].concat(this.sectionName, " ");
			});
			crawlNYTimes(x,i);
		
			$('#topiccloud').html('</br>');
			// alert("calling topicize 10");
			topicise(10);

		});
	
	return false;
}