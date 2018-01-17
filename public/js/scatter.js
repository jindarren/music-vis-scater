var spotifyToken = $.cookie('spotify-token')
var refreshToken = $.cookie('refresh-token')

var loggingSys = {}
loggingSys.timestamp = new Date();
loggingSys.id = '';
loggingSys.path = window.location.pathname;
loggingSys.duration = new Date();
loggingSys.rating = {
    id:[],
    likes:[],
    same:[]
};
loggingSys.vis = []
loggingSys.likedTime = 0;
loggingSys.recoms = [];
loggingSys.diversity = 0;
loggingSys.hoverTime = 0;
loggingSys.clickTime = 0;
loggingSys.axisTime = 0;

var margin = { top: 50, right: 300, bottom: 50, left: 50 },
    outerWidth = 1050,
    outerHeight = 500,
    width = outerWidth - margin.left - margin.right,
    height = outerHeight - margin.top - margin.bottom;

$(document).ready(function () {
    //alert("Please make sure you have submitted the pre-study questionnaire!")
    //refresh the token
    setInterval(function () {
        $.ajax("/refresh-token?refresh_token="+refreshToken, function (data, err) {
            if(err)
                console.log(err)
            else{
                console.log(data)
                spotifyToken = data.access_token
                refreshToken = data.refresh_token
                $.cookie('spotify-token', spotifyToken);
                $.cookie('refresh-token', refreshToken);
            }
        })
    }, 3500*1000)
});


var x = d3.scale.linear()
    .range([0, width]).nice();

var y = d3.scale.linear()
    .range([height, 0]).nice();

var yCat = "liveness",
    xCat = "valence",
    rCat = "popularity",
    colorCat = "genre";

$.ajax({
    url: "/initiate?token=" + spotifyToken,
    success: function (dat) {
        console.log(dat)
        loggingSys.recoms = dat.vis;
        loggingSys.diversity = dat.intra;

        $("div#initial-loading").hide();
        $(".main-content").show();
        var data = dat.vis
        var selectedNode;
        var recomList = [];


        function checkGenreVisit(id,preID){
            var preGenre, curGenre
            for (var index in loggingSys.recoms){
                if(loggingSys.recoms[index].track==preID)
                    preGenre = loggingSys.recoms[index].genre
                else if(loggingSys.recoms[index].track==id)
                    curGenre = loggingSys.recoms[index].genre
            }
            // console.log(preGenre, curGenre)
            if(preGenre == curGenre)
                return true
            else if(preGenre != curGenre)
                return false
        }

        var regEvents = function(itemID) {

            $("div#"+itemID+" > div.recom-icon >  div.recom-rating > i:eq(1)").click(function () {
                //LOGGING
                //loggingSys.lowRatingTime += 1

                var dislikedRecomId = $(this).parent().parent().parent().attr('id')

                //LOGGING
                if(loggingSys.rating.id.indexOf(dislikedRecomId)<0){
                    loggingSys.rating.id.push(dislikedRecomId)
                    loggingSys.rating.likes.push(false)
                    if(loggingSys.rating.id.length>1)
                        loggingSys.rating.same.push(checkGenreVisit(dislikedRecomId, loggingSys.rating.id[loggingSys.rating.id.length-2]))
                    else
                        loggingSys.rating.same.push(false)
                }else{
                    var index = loggingSys.rating.id.indexOf(dislikedRecomId)
                    loggingSys.rating.likes[index] = false
                    if(index>0)
                        loggingSys.rating.same[index] = checkGenreVisit(dislikedRecomId, loggingSys.rating.id[index-1])
                    else
                        loggingSys.rating.same[index] = false
                }

                if($(this).hasClass("fa-thumbs-o-down")){
                    $(this).removeClass("fa-thumbs-o-down");
                    $(this).addClass("fa-thumbs-down")

                    if($(this).prev().hasClass("fa-thumbs-up")){
                        $(this).prev().removeClass("fa-thumbs-up")
                        $(this).prev().addClass("fa-thumbs-o-up")
                    }
                }
                else if($(this).hasClass("fa-thumbs-down")){
                    $(this).removeClass("fa-thumbs-down");
                    $(this).addClass("fa-thumbs-o-down")
                }
            })

            $("div#"+itemID+" > div.recom-icon > div.recom-rating > i:eq(0)").click(function () {
                //LOGGING
                //loggingSys.lowRatingTime += 1

                var likedRecomId = $(this).parent().parent().parent().attr('id')

                //LOGGING

                if(loggingSys.rating.id.indexOf(likedRecomId)<0){
                    loggingSys.rating.id.push(likedRecomId)
                    loggingSys.rating.likes.push(true)
                    if(loggingSys.rating.id.length>1)
                        loggingSys.rating.same.push(checkGenreVisit(likedRecomId, loggingSys.rating.id[loggingSys.rating.id.length-2]))
                    else
                        loggingSys.rating.same.push(false)
                }else{
                    var index = loggingSys.rating.id.indexOf(likedRecomId)
                    loggingSys.rating.likes[index] = true
                    if(index>0)
                        loggingSys.rating.same[index] = checkGenreVisit(likedRecomId, loggingSys.rating.id[index-1])
                    else
                        loggingSys.rating.same[index] = false
                }

                if($(this).hasClass("fa-thumbs-o-up")){
                    $(this).removeClass("fa-thumbs-o-up");
                    $(this).addClass("fa-thumbs-up")

                    if($(this).next().hasClass("fa-thumbs-down")){
                        $(this).next().removeClass("fa-thumbs-down")
                        $(this).next().addClass("fa-thumbs-o-down")
                    }
                }
                else if($(this).hasClass("fa-thumbs-up")){
                    $(this).removeClass("fa-thumbs-up");
                    $(this).addClass("fa-thumbs-o-up")
                }
            })
        }

        data.forEach(function (d) {
            //console.log(d["genre"])
            var uri = "https://open.spotify.com/embed?uri=spotify%3Atrack%3A"+d.track+"&theme=white"
            $("#recom-seeds").prepend('<div class="recom-items lift-top" id ='+ d.track+'><iframe src='+uri+' width="300" height="80" frameborder="0" allowtransparency="true"></iframe><div class="recom-icon"><div class="recom-deletion"></div><div class="recom-rating"><i class="fa fa-thumbs-o-up" aria-hidden="true"></i><i class="fa fa-thumbs-o-down" aria-hidden="true"></i></div></div></div>')
            $("div#"+d.track).click(function () {
                highlightenResults(d.track)
                if(selectedNode)
                    selectedNode.style("stroke","#565352").style("stroke-width",1)
                selectedNode = d3.select("#i"+d.track)
                selectedNode.style("stroke","red").style("stroke-width",3)
            })
            regEvents(d["track"])
            recomList.push(d["track"])
        })


        var highlightenResults = function (seedID, isScroll) {
            //LOGGING
            $("#recom-seeds div").each(function () {
                if($(this).attr("id")==seedID){

                    if(isScroll){
                        var pos = ((19-recomList.indexOf(seedID))/19)*$('.recom')[0].scrollHeight-100
                        $(".recom").animate({ scrollTop: pos }, 500);
                        console.log($('.recom')[0].scrollHeight, pos, recomList.indexOf(seedID))
                    }
                    $(this).css("border", "solid 2px #EF283B")
                }else{
                    $(this).css("border", "none")
                }
            })
        }

        var xMax = d3.max(data, function(d) { return d[xCat]; }) * 1.05,
            xMin = d3.min(data, function(d) { return d[xCat]; }),
            xMin = xMin > 0 ? 0 : xMin,
            yMax = d3.max(data, function(d) { return d[yCat]; }) * 1.05,
            yMin = d3.min(data, function(d) { return d[yCat]; }),
            yMin = yMin > 0 ? 0 : yMin;

        x.domain([xMin, xMax]);
        y.domain([yMin, yMax]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickSize(-height);

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickSize(-width);

        var color = d3.scale.category10();

        var tip = d3.tip()
            .attr("class", "d3-tip")
            .offset([-10, 0])
            .html(function(d) {
                loggingSys.hoverTime +=1
                return d["name"] + "<br><br>" + xCat + ": " + d[xCat] + "<br>" + yCat + ": " + d[yCat] +  "<br>"+ rCat + ": " + d[rCat] + "<br>" + colorCat + ": " + d[colorCat];
            });

        var zoomBeh = d3.behavior.zoom()
            .x(x)
            .y(y)
            .scaleExtent([0, 500])
            .on("zoom", zoom);

        var svg = d3.select("#scatter")
            .append("svg")
            .attr("width", outerWidth)
            .attr("height", outerHeight)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(zoomBeh)

        svg.call(tip);

        svg.append("rect")
            .attr("width", width)
            .attr("height", height);

        svg.append("g")
            .classed("x axis", true)
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .append("text")
            .classed("label", true)
            .attr("x", width)
            .attr("y", margin.bottom - 10)
            .style("text-anchor", "end")
            .style("font-size","16px")
            .text(xCat);

        svg.append("g")
            .classed("y axis", true)
            .call(yAxis)
            .append("text")
            .classed("label", true)
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .style("font-size","16px")
            .text(yCat);

        var objects = svg.append("svg")
            .classed("objects", true)
            .attr("width", width)
            .attr("height", height);

        objects.append("svg:line")
            .classed("axisLine hAxisLine", true)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", width)
            .attr("y2", 0)
            .attr("transform", "translate(0," + height + ")");

        objects.append("svg:line")
            .classed("axisLine vAxisLine", true)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", height);

        var node = objects.selectAll(".dot")
            .data(data)
            .enter().append("g")
            .classed("dot", true)
            .attr("transform", transform)


        node.append("circle")
            .attr("id",function (d) {
                return "i"+d["track"]
            })
            .attr("r", function (d) { return 6 * Math.sqrt(d[rCat] / Math.PI); })
            .style("fill", function(d) { return color(d[colorCat]); })
            .on("mouseover", tip.show)
            .on("mouseout", tip.hide)
            .style("cursor","pointer")
            .on("click", function(d){
                if(selectedNode)
                    selectedNode.style("stroke","#565352").style("stroke-width",1)
                highlightenResults(d.track, true)
                selectedNode = d3.select(this)
                selectedNode.style("stroke","red").style("stroke-width",3)

                //Logging
                if(loggingSys.vis.length==0){
                    var circle = {}
                    circle.id = d.track
                    circle.same = false
                    loggingSys.vis.push(circle)
                }else if(loggingSys.vis.length>0){
                    var circle = {}
                    circle.id = d.track
                    circle.same = checkGenreVisit(d.track, loggingSys.vis[loggingSys.vis.length-1].id)
                    loggingSys.vis.push(circle)
                }
                loggingSys.clickTime +=1
            })

        node.append("text")
            .attr("dy", ".3em")
            .style("text-anchor", "middle")
            .text(function(d) { return d["name"].substring(0, parseInt(6 * Math.sqrt(d[rCat] / Math.PI) / 3)); });

        var title = svg.selectAll(".title")
            .data(["Music genres"])
            .enter().append("g")
            .classed("legend", true);

        title.append("text")
            .attr("x", width + 15)
            .attr("dy", ".35em")
            .style("font-size","14px")
            .style("font-weight","bold")
            .text("Music genres");

        var legend = svg.selectAll(".legend")
            .data(color.domain())
            .enter().append("g")
            .classed("legend", true)
            .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

        legend.append("circle")
            .attr("r", 5)
            .attr("cx", width + 20)
            .attr("fill", color);

        legend.append("text")
            .attr("x", width + 26)
            .attr("dy", ".35em")
            .text(function(d) { return d; });


        var title2 = svg.selectAll(".title")
            .data(["Popularity"])
            .enter().append("g")
            .classed("legend", true);

        title2.append("text")
            .attr("x", width + 15)
            .attr("dy", 325)
            .style("font-size","14px")
            .style("font-weight","bold")
            .text("Popularity");

        var legend2 = svg.selectAll(".legend2")
            .data([100,80,60,40,20])
            .enter().append("g")
            .classed("legend2", true)
            .attr("transform", function(d, i) { return "translate(0," + i * 5 + ")"; });

        legend2.append("circle")
            .attr("r", function(d) { return 6 * Math.sqrt(d / Math.PI); })
            .attr("cx", width + 50)
            .attr("cy", 380)
            .attr("stroke", "#565352")
            .attr("fill", "none");

        legend2.append("text")
            .attr("x", width + 45)
            .attr("dy", 345)
            .attr("transform", function(d, i) { return "translate(0," + i * 5 + ")"; })
            .style("font-size","10px")
            .text(function(d) { return d; });


        $("p#des-x").text(loadDes("valence"))
        $("p#des-y").text(loadDes("liveness"))

        d3.selectAll("select").on("change", change);
        function change() {
            loggingSys.axisTime +=1
            var xSelect=document.getElementById("x-axis"),ySelect=document.getElementById("y-axis");
            var xIndex= xSelect.selectedIndex, yIndex = ySelect.selectedIndex ;
            xCat = xSelect.options[xIndex].value;
            yCat = ySelect.options[yIndex].value;
            $("p#des-x").text(loadDes(xCat))
            $("p#des-y").text(loadDes(yCat))

            xMax = d3.max(data, function(d) { return d[xCat]; });
            xMin = d3.min(data, function(d) { return d[xCat]; });

            zoomBeh.x(x.domain([xMin, xMax])).y(y.domain([yMin, yMax]));

            var svg = d3.select("#scatter").transition();

            svg.select(".x.axis").duration(750).call(xAxis).select(".label").text(xCat);
            svg.select(".y.axis").duration(750).call(yAxis).select(".label").text(yCat);

            objects.selectAll(".dot").transition().duration(1000).attr("transform", transform);
        }

        function loadDes(feature) {
            var featureDes
            if (feature =="acousticness"){
                featureDes = "A confidence measure from 0.0 to 1.0 of whether the track is acoustic. 1.0 represents high confidence the track is acoustic."
            }else if(feature =="danceability"){
                featureDes = "Danceability describes how suitable a track is for dancing based on a combination of musical elements including tempo, rhythm stability, beat strength, and overall regularity. A value of 0.0 is least danceable and 1.0 is most danceable."
            }else if(feature =="energy"){
                featureDes = "Energy is a measure from 0.0 to 1.0 and represents a perceptual measure of intensity and activity. Typically, energetic tracks feel fast, loud, and noisy. For example, death metal has high energy, while a Bach prelude scores low on the scale. Perceptual features contributing to this attribute include dynamic range, perceived loudness, timbre, onset rate, and general entropy."
            }else if(feature =="instrumentalness"){
                featureDes = 'Predicts whether a track contains no vocals. "Ooh" and "aah" sounds are treated as instrumental in this context. Rap or spoken word tracks are clearly "vocal". The closer the instrumentalness value is to 1.0, the greater likelihood the track contains no vocal content. Values above 0.5 are intended to represent instrumental tracks, but confidence is higher as the value approaches 1.0.'
            }else if(feature =="liveness"){
                featureDes = "Detects the presence of an audience in the recording. Higher liveness values represent an increased probability that the track was performed live. A value above 0.8 provides strong likelihood that the track is live."
            }else if(feature =="speechiness"){
                featureDes = "Speechiness detects the presence of spoken words in a track. The more exclusively speech-like the recording (e.g. talk show, audio book, poetry), the closer to 1.0 the attribute value. Values above 0.66 describe tracks that are probably made entirely of spoken words. Values between 0.33 and 0.66 describe tracks that may contain both music and speech, either in sections or layered, including such cases as rap music. Values below 0.33 most likely represent music and other non-speech-like tracks."
            }else if(feature =="valence"){
                featureDes = "A measure from 0.0 to 1.0 describing the musical positiveness conveyed by a track. Tracks with high valence sound more positive (e.g. happy, cheerful, euphoric), while tracks with low valence sound more negative (e.g. sad, depressed, angry)."
            }
            return featureDes
        }

        function zoom() {
            svg.select(".x.axis").call(xAxis);
            svg.select(".y.axis").call(yAxis);

            svg.selectAll(".dot")
                .attr("transform", transform);
        }

        function transform(d) {
            return "translate(" + x(d[xCat]) + "," + y(d[yCat]) + ")";
        }

    }
})

setTimeout(function () {
    enableEvaluation = true
    var totalRating = $(".fa-thumbs-up").length + $(".fa-thumbs-down").length
    if(totalRating==20){
        $("a.btn.btn-info.questionnaire").attr("href","https://goo.gl/forms/ed0TGWaTzbhvbXo22")
    }
}, 1000*10*60);

//Sent Logs
$('.questionnaire').click(function () {
    var totalRating = $(".fa-thumbs-up").length + $(".fa-thumbs-down").length

    if(totalRating == 20 && enableEvaluation){
        $("a.btn.btn-info.questionnaire").attr("href","https://goo.gl/forms/ed0TGWaTzbhvbXo22")
        var currentTime = new Date();
        var userID = document.getElementById("user-id").innerText
        loggingSys.duration = currentTime - loggingSys.duration
        loggingSys.id = userID
        loggingSys.likedTime = $(".fa-thumbs-up").length
        console.log(loggingSys)
        $.ajax({
            url: '/addRecord',
            type: 'POST',
            contentType:'application/json',
            data: JSON.stringify(loggingSys),
            dataType:'json'
        });
        prompt("Please copy the following ID as the answer to the first question in the questionnaire", userID);
    }else{
        $("p#start-feedback").show();
        setTimeout(function () {
            $("p#start-feedback").hide();
        },8000)
    }
})