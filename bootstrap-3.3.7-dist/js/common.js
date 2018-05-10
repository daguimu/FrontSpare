function basefun(method, data, requestme, fun) {
    //var orign_ip = "http://localhost:9999/";
    var orign_ip = "http://www.airi.net.cn/";
    var token_fa = $("#myphone", window.parent.document).val();
    if (method != "userLogin" && token_fa == undefined
        && method != "getAllDepts" && method != "getAllNormalUserByDept" && method != "addUser") {
        alert("您还没有登录");
        //window.location.href = "../../FrontSpare/login/index.html";
    }
    var token = token_fa == undefined ? null : sessionStorage.getItem("token:" + token_fa.split("-")[0]);
    var header = {"token": token};
    $.post({
        url: orign_ip + method,
        type: requestme,
        headers: header,
        data: JSON.stringify(data),
        dataType: "json",
        Origin: orign_ip,
        contentType: "application/json",
        success: function (resultdata) {
            if (resultdata.message == "您还没有登录") {
                alert("您还没有登录");
                window.location.href = "../../FrontSpare/login/index.html";
            }
            fun(resultdata);
        }
    });
}


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

function createTurnPage(name, total, fun) {
    var container = $("iframe").contents().find('#pagination-' + name);
    var sources = function () {
        var result = [];
        for (var i = 1; i <= total; i++) {
            result.push(i);
        }
        return result;
    }();
    var options = {
        dataSource: sources,
        callback: function (response, pagination) {
            //window.console && console.log(response, pagination);

            var dataHtml = '<ul>';

            $.each(response, function (index, item) {
                dataHtml += '<li>' + item + '</li>';
            });

            dataHtml += '</ul>';

            container.prev().html(dataHtml);
            fun(pagination.pageNumber);
        }
    };
    //$.pagination(container, options);
    container.addHook('beforeInit', function () {
        //window.console && console.log('beforeInit...');
    });
    container.pagination(options);

    container.addHook('beforePageOnClick', function () {
        //window.console && console.log('beforePageOnClick...');
        //return false
    });
}

