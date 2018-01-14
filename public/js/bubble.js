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

var width = 800,
    height = 500,
    padding = 5, // separation between same-color nodes
    clusterPadding = 30, // separation between different-color nodes
    maxRadius = 12;

var color = d3.scale.category10();


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
            }
        })
    }, 3500*1000)
});

$.ajax({
    url: "/initiate?token=" + spotifyToken,
    success: function (dat) {
        var cs = [];
        var selectedNode;
        var recomList = [];

        var data = dat.vis

        loggingSys.recoms = dat.vis;
        loggingSys.diversity = dat.intra;

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
                if(loggingSys.recoms[index].track==id)
                    curGenre = loggingSys.recoms[index].genre
            }
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

        data.forEach(function(d){
            if(!cs.contains(d["genre"])) {
                cs.push(d["genre"]);
            }
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
            recomList.push(d.track)
        });


        var n = data.length, // total number of nodes
            m = cs.length; // number of distinct clusters

//create clusters and nodes
        var clusters = new Array(m);
        var nodes = [];
        for (var i = 0; i<n; i++){
            nodes.push(create_nodes(data,i));
        }

        var force = d3.layout.force()
            .nodes(nodes)
            .size([width, height])
            .gravity(.02)
            .charge(0)
            .on("tick", tick)
            .start();


        var svg = d3.select("#bubble")
            .append("svg")
            .attr("width", width)
            .attr("height", height)

        var tip = d3.tip()
            .attr("class", "d3-tip")
            .offset([-10, 0])
            .html(function(d) {
                loggingSys.hoverTime += 1;
                return d["text"] + "<br><br>" + "popularity: " + d["popularity"] + "<br>"  + "genre: " + d["genre"];
            });
        svg.call(tip);



        var node = svg.selectAll("circle")
            .data(nodes)
            .enter().append("g").call(force.drag);

        var selectedNode
        node.append("circle")
            .attr("id",function (d) {
                return "i"+d["track"]
            })
            .style("fill", function (d) {
                return color(d.cluster);
            })
            .attr("r", function(d){return d.radius})
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

            });


        node.append("text")
            .attr("dy", ".3em")
            .style("text-anchor", "middle")
            .text(function(d) { return d.text.substring(0, d.radius / 3); });

        function create_nodes(data,node_counter) {
            var i = cs.indexOf(data[node_counter]["genre"]),
                r = Math.sqrt((i + 1) / m * -Math.log(Math.random())) * maxRadius,
                d = {
                    cluster: i,
                    genre: data[node_counter]["genre"],
                    track: data[node_counter]["track"],
                    popularity: data[node_counter]["popularity"],
                    radius: 6 * Math.sqrt(data[node_counter]["popularity"] / Math.PI),
                    text: data[node_counter]["name"],
                    x: Math.cos(i / m * 2 * Math.PI) * 200 + width / 2 + Math.random(),
                    y: Math.sin(i / m * 2 * Math.PI) * 200 + height / 2 + Math.random()
                };
            if (!clusters[i] || (r > clusters[i]["popularity"])) clusters[i] = d;
            return d;
        };


        var title = svg.selectAll(".title")
            .data(["Music genres"])
            .enter().append("g")
            .classed("legend", true);

        title.append("text")
            .attr("x", width-150 + 15)
            .attr("y", 50)
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
            .attr("cx", width-150 + 20)
            .attr("cy", 50)
            .attr("fill", color);

        legend.append("text")
            .attr("x", width-150 + 26)
            .attr("y", 50 )
            .attr("dy", ".35em")
            .text(function(d) { return cs[d]; });


        var title2 = svg.selectAll(".title")
            .data(["Popularity"])
            .enter().append("g")
            .classed("legend", true);

        title2.append("text")
            .attr("x", width-150 + 15)
            .attr("dy", 390)
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
            .attr("cx", width -150 + 50)
            .attr("cy", 450)
            .attr("stroke", "#565352")
            .attr("fill", "none");

        legend2.append("text")
            .attr("x", width -150 + 45)
            .attr("dy", 415)
            .attr("transform", function(d, i) { return "translate(0," + i * 5 + ")"; })
            .text(function(d) { return d; });

        function tick(e) {
            node.each(cluster(10 * e.alpha * e.alpha))
                .each(collide(.5))
                .attr("transform", function (d) {
                    var k = "translate(" + d.x + "," + d.y + ")";
                    return k;
                })
        }

// Move d to be adjacent to the cluster node.
        function cluster(alpha) {
            return function (d) {
                var cluster = clusters[d.cluster];
                if (cluster === d) return;
                var x = d.x - cluster.x,
                    y = d.y - cluster.y,
                    l = Math.sqrt(x * x + y * y),
                    r = d.radius + cluster.radius;
                if (l != r) {
                    l = (l - r) / l * alpha;
                    d.x -= x *= l;
                    d.y -= y *= l;
                    cluster.x += x;
                    cluster.y += y;
                }
            };
        }

// Resolves collisions between d and all other circles.
        function collide(alpha) {
            var quadtree = d3.geom.quadtree(nodes);
            return function (d) {
                var r = d.radius + maxRadius + Math.max(padding, clusterPadding),
                    nx1 = d.x - r,
                    nx2 = d.x + r,
                    ny1 = d.y - r,
                    ny2 = d.y + r;
                quadtree.visit(function (quad, x1, y1, x2, y2) {
                    if (quad.point && (quad.point !== d)) {
                        var x = d.x - quad.point.x,
                            y = d.y - quad.point.y,
                            l = Math.sqrt(x * x + y * y),
                            r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);
                        if (l < r) {
                            l = (l - r) / l * alpha;
                            d.x -= x *= l;
                            d.y -= y *= l;
                            quad.point.x += x;
                            quad.point.y += y;
                        }
                    }
                    return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                });
            };
        }
    }
});

Array.prototype.contains = function(v) {
    for(var i = 0; i < this.length; i++) {
        if(this[i] === v) return true;
    }
    return false;
};

setTimeout(function () {
    enableEvaluation = true
    var totalRating = $(".fa-thumbs-up").length + $(".fa-thumbs-down").length
    if(totalRating==20){
        $("a.btn.btn-info.questionnaire").attr("href","https://goo.gl/forms/tNqrRPi4zw0hA5kO2")
    }
}, 1000*10*60);

//Sent Logs
$('.questionnaire').click(function () {
    var totalRating = $(".fa-thumbs-up").length + $(".fa-thumbs-down").length

    if(totalRating == 20 && enableEvaluation){
        $("a.btn.btn-info.questionnaire").attr("href","https://goo.gl/forms/tNqrRPi4zw0hA5kO2")
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