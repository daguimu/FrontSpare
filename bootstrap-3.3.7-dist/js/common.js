function basefun(method, data, fun) {
    $.post({
        url: "http://localhost:9999/" + method,
        type: "post",
        data: JSON.stringify(data),
        dataType: "json",
        Origin:"http://localhost:9999/",
        contentType: "application/json",
        success: function (resultdata) {
            fun(resultdata);
        }
    });
}

function getBoxValue() {
    var chk_value = [];
    $('input[type="checkbox"]:checked').each(function () {
        chk_value.push($(this).val());
    });
    if (chk_value[0] == 'on') {
        chk_value.splice(0, 1);
    }
    return chk_value;
}

function createTurnPage(name, elcount) {
    var container = $('#pagination-' + name);
    var sources = function () {
        var result = [];

        for (var i = 1; i < elcount + 1; i++) {
            result.push(i);
        }

        return result;
    }();

    var options = {
        dataSource: sources,
        className: 'paginationjs-theme-blue',
        callback: function (response, pagination) {
        }
    };

    container.addHook('beforeInit', function () {
        //window.console && console.log('beforeInit...');
    });
    container.pagination(options);

    container.addHook('beforePageOnClick', function () {
    });

    return container;
}

$(document).on('mouseup', '.paginationjs-pages li', function() {
    var curv=$(this).text();
    if(isNaN(curv)){
        var tem=$(".active").text();
        if(curv=="»"){
            if($(".paginationjs-pages li a:eq(-2)").text()==tem){
                ;
            }else{
                tem++;
            }

        }else if(curv=="«") {
            if($(".paginationjs-pages li a:eq(1)").text()==tem){
                ;
            }else{
                tem--;
            }
        }
        $("#currpage").val(tem);
        Init(tem);
    }else {
        $("#currpage").val(curv);
        Init(curv);
    }
});
