/**
 * Save My Link Utils
 */

//오늘 날짜를 구하는 함수
/**
 * 오늘 날짜를 양식 (yyyy-MM-dd hh:mm:ss) 으로 반환 하는 함수
 * @returns (String) yyyy-MM-dd hh:mm:ss
 */
function getNowDateStr() {
    const date = new Date(+new Date() + 3240 * 10000)
        .toISOString()
        .split("T")[0];
    const time = new Date().toTimeString().split(" ")[0];
    return date + " " + time;
}

/**
 * 전달된 값이 null(또는 undefined) 체크하는 함수
 * @param {Object} str
 * @returns true = null || undefined  / false = not null
 */
function isNullValue(str) {
    if (str === null) return true;
    if (str === "NaN") return true;
    if (String(str).valueOf() === "undefined") return true;

    let chkStr = String(str); //new String(str);
    if (chkStr.valueOf() === "undefined") return true;
    if (chkStr === null) return true;
    return chkStr.toString().length === 0;
}

/**
 * 전달된 Object 가 비어있는지 체크하는 함수
 * @param {*} targetObj
 * @returns
 */
function isEmptyKeyValueObj(targetObj) {
    return Object.keys(targetObj).length === 0 ? true : false;
}

/**
 * 전달된 숫자 사이의 랜덤 값을 전달하는 함수
 * @param {*} min
 * @param {*} max
 * @returns 랜덤 닶
 */
function rand(min = 0, max = 5) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//////////////////////////////
//      Electron Only
//////////////////////////////

//전달된 url open 함수
function openUrlWithBrowser(url) {
    require("electron").shell.openExternal(url);
}

//////////////////////////////
//           Valid
//////////////////////////////

/**
 * 전달된 String url 이 정상적인지 검증하는 함수
 * @param {*} target_url
 * @returns
 */
function isValidHttpUrl(target_url) {
    if (target_url.substring(0, 4) === "http") {
        //Url schema 가 붙은 경우
        let url;
        try {
            url = new URL(target_url);
        } catch (_) {
            return false;
        }
        return url.protocol === "http:" || url.protocol === "https:";
    } else {
        //No schema
        var pattern = new RegExp(
            "^(https?:\\/\\/)?" + // protocol
                "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
                "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
                "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
                "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
                "(\\#[-a-z\\d_]*)?$",
            "i"
        ); // fragment locator
        return !!pattern.test(target_url);
    }
}

/**
 * Json 검증 함수
 * @param {*} json
 * @returns
 */
function isValidJson(json) {
    try {
        JSON.parse(json);
        return true;
    } catch (e) {
        return false;
    }
}

//////////////////////////////
//    Async Promise handler
//////////////////////////////

/**
 * Promise 처리가 끝난 데이터에 대하여
 * @param {*} resultData
 * @returns
 */
function isSuccessPromise(resultData) {
    return (
        resultData.hasOwnProperty("status") &&
        resultData["status"] === "success"
    );
}

/**
 *
 * @returns
 */
function makeDefaultBody4Fail(addOnData = {}) {
    let defaultBody = { status: "fail", error_msg: "No send error msg." };
    for (const key of Object.keys(addOnData)) {
        defaultBody[key] = addOnData[key];
    }
    return defaultBody;
}

/**
 * Promise 성공 시 기본 객체
 * @param {*} addOnData
 * @returns
 */
function makeDefaultBody4Success(addOnData = {}) {
    let defaultBody = { status: "success" };
    for (const key of Object.keys(addOnData)) {
        defaultBody[key] = addOnData[key];
    }
    return defaultBody;
}

/**
 * Promise 에러 처리를 하는 함수
 * @param {*} err
 */
function errorHandler4Promise(err) {
    if (err.hasOwnProperty("swal")) {
        err.swal;
    } else if (err.hasOwnProperty("error_msg")) {
        Swal.fire("예외 발생", "Error = " + err.error_msg, "error");
    } else {
        Swal.fire("예외 발생", "Error = " + err, "error");
        console.log("err = " + err);
    }
}
