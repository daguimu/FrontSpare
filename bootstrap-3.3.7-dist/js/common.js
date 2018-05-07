function basefun(method, data, requestme, fun) {
    var token_fa = $("#myphone", window.parent.document).val();
    if (method != "userLogin" && token_fa == undefined) {
        alert("您还没有登录");
        window.location.href= "../../FrontSpare/login/index.html";
    }
    var token = token_fa == undefined ? null : sessionStorage.getItem("token:" + token_fa.split("-")[0]);
    var header = {"token": token};
    $.post({
        url: "http://localhost:9999/" + method,
        type: requestme,
        headers: header,
        data: JSON.stringify(data),
        dataType: "json",
        Origin: "http://localhost:9999/",
        contentType: "application/json",
        success: function (resultdata) {
            if (resultdata.message == "您还没有登录") {
                alert("您还没有登录");
                window.location.href= "../../FrontSpare/login/index.html";
            }
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

$(document).on('mouseup', '.paginationjs-pages li', function () {
    var curv = $(this).text();
    if (isNaN(curv)) {
        var tem = $(".active").text();
        if (curv == "»") {
            if ($(".paginationjs-pages li a:eq(-2)").text() == tem) {
                ;
            } else {
                tem++;
            }

        } else if (curv == "«") {
            if ($(".paginationjs-pages li a:eq(1)").text() == tem) {
                ;
            } else {
                tem--;
            }
        }
        $("#currpage").val(tem);
        Init(tem);
    } else {
        $("#currpage").val(curv);
        Init(curv);
    }
});


function numberConvert(num) {
    var len = (num + "").length;
    var result = "";
    for (var i = 0; i < 8 - len; i++) {
        result += "0";
    }
    return result + num;
}

function logout() {
    var token_fa = $("#myphone", window.parent.document).val();
    sessionStorage.removeItem("token:" + token_fa.split("-")[0]);
    self.location = "../../FrontSpare/login/index.html";
}

