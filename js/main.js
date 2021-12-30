const { ipcRenderer } = require("electron");

//common variable
var doc = document; //전역 변수
var addLinkModal = document.getElementById("addLinkModal");
var localPath = "";
var appConfig;

//Page Variable
var limit = 10; //페이지 당 보여줄 수
var nowPage = 1; //현재 페이지 (가변적)
var totalPage = 0; //총 페이지 (가변적)
var totalItemCnt = 0; //총 아이템 갯수

//Search Type
var searchType = "name";
var searchData = "";

//////////////////////////////
//   Window Event
//////////////////////////////

window.onload = function () {
    //Main process에서 값 가져오는 부분
    ipcRenderer.send("synchronous-message", "send data");
    ipcRenderer.on("synchronous-reply", (event, arg) => {
        localPath = arg["localPath"];
        appConfig = arg["app_config"];
    });

    //DB 처리
    initWithDB();

    setTimeout(() => {
        //기본 데이터 초기화 작업 처리
        initWithToolTip();
        initWithSelectTag(); //

        //페이징 처리
        setupPageData();
        setPageCriteriaData4Table(makeCriteria("", 10, 1));
    }, 50);
};

window.addEventListener("DOMContentLoaded", function () {});

//////////////////////////////
//             Init
//////////////////////////////

/**
 * Tooltip 초기화 처리 함수
 */
function initWithToolTip() {
    //일괄적으로 전체 다 툴팁 셋업
    var tooltipTriggerList = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

//////////////////////////////
//     EventListener
//////////////////////////////

//검색 부분
doc.getElementById("search_dropdown_name").addEventListener(
    "click",
    function (event) {
        doc.getElementById("search_name_input").style.display = "";
        doc.getElementById("search_name_tag").style.display = "none";
        doc.getElementById("search_type_bt").innerText = "이름";
        searchType = "name";
        event.preventDefault();
    }
);

doc.getElementById("search_dropdown_tag").addEventListener(
    "click",
    function (event) {
        doc.getElementById("search_name_input").style.display = "none";
        doc.getElementById("search_name_tag").style.display = "";
        doc.getElementById("search_type_bt").innerText = "태그";
        searchType = "tag";
        event.preventDefault();
    }
);

//////////////////////////////
//
//////////////////////////////

/**
 * 페이징과 검색을 처리하는 함수
 * @param {*} criteria
 */
async function setPageCriteriaData4Table(criteria) {
    //테이블 데이터
    let table = doc
        .getElementById("linkTable")
        .getElementsByTagName("tbody")[0];

    try {
        let tmpLinkData;
        if (searchType === "tag") {
            tmpLinkData = await getLinkDataPage4Tag(
                criteria["search"],
                criteria["limit"],
                criteria["currentPage"]
            );
        } else {
            tmpLinkData = await getLinkDataPage4Name(
                criteria["search"],
                criteria["limit"],
                criteria["currentPage"]
            );
        }

        //링크 데이터를 가져온다.
        for (const item of tmpLinkData["data"]) {
            var trElement = document.createElement("tr");
            //테이블 안의 link의 태그 부분 (색상 랜덤 조립)
            let makeSomeTagLabel = "";
            `${item.tags}`.split(",").forEach((tag) => {
                makeSomeTagLabel +=
                    "<span class='badge rounded-pill " +
                    getRandomLabelColor() +
                    "'>" +
                    tag +
                    "</span> ";
            });

            const name = `<td>${item.name}</td>`;
            const link = `<td><a href="javascript:openUrlWithBrowser('${
                item.link
            }')">${
                item.link.length > 30
                    ? item.link.toString().substring(0, 29) + "..."
                    : item.link
            }</a></td>`;
            const tags = "<td>" + makeSomeTagLabel + "</td>";
            const create_date = `<td>${item.create_date}</td>`;
            const btGroup = `<td><button onclick="clickBt4LinkDataUpdate('${item.row_id}','${item.name}', '${item.link}', '${item.tags}')" data-bs-send-type="LinkDataUpdate" class="btn btn-outline-warning">수정</button>&nbsp;&nbsp;<button onclick="clickBt4LinkDataDelete('${item.row_id}')" class="btn btn-outline-danger">삭제</button></td>`;
            trElement.innerHTML = name + link + tags + create_date + btGroup;
            table.appendChild(trElement); //테이블에 태그 조립해서 붙여준다
        }

        /////Tag Data
        const tmpTagData = await getTagData4All();
        setData4AddLinkTagSelect(tmpTagData["data"]);

        ///Page
        setupPageData(criteria);
    } catch (error) {
        errorHandler4Promise(error);
    }
}

//////////////////////////////
//      Button Click
//////////////////////////////

/**
 * Github 버튼
 */
function click4Github() {
    openUrlWithBrowser(appConfig.GITHUB);
}

/**
 * App info
 */
function click4AppInfo() {
    Swal.fire({
        title: "Save My Link",
        html: `앱의 사용법, 기타사항 및 자세한 사항은 <br> 메뉴 [Github]를 참고해주세요. <br><br> 버전 : ${appConfig.APP_VERSION} <br><br> 만든이 : ${appConfig.APP_AUTH} <br> 문의사항 : ${appConfig.APP_MAIL}`,
        // text: "Modal with a custom image.",
        imageUrl: "./res/sml_icon.png",
        imageWidth: 150,
        imageHeight: 150,
        imageAlt: "Custom image",
    });
}

/**
 * 메뉴 종료 처리
 */
function click4Quit() {
    Swal.fire({
        title: "종료",
        text: "앱을 종료하시겠습니까?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "종료",
        cancelButtonText: "취소",
    }).then(async (result) => {
        if (result.isConfirmed) {
            ipcRenderer.send("asynchronous-message", "quit");
        }
    });
}

/**
 * 상단 로고 (메인으로 돌아가기 기능)
 */
function click4SML() {
    doc.getElementById("search_name_input").value = "";
    //Tag 모드일 경우 셀렉트 초기화
    searchLinkTagSelectObj.clearChoices();
    doc.getElementById("search_dropdown_name").click();
    resetDefaultValue(); //기본 값 초기화
    reloadTableData(makeCriteria("", 10, 1)); //페이지 갱신
}

/**
 * 검색 버튼
 */
function click4Search() {
    if (searchType === "name") {
        const searchDataInput = doc.getElementById("search_name_input").value;
        searchData = searchDataInput;
    } else {
        searchData = ""; //기존 값은 초기화
        const searchTagItem = doc.getElementById("search_link_tag_select");

        //선택된 값만 가져온다.
        for (let i = 0; i < searchTagItem.options.length; i++) {
            const option = searchTagItem.options[i];
            searchData += option.value + ",";
        }
        searchData = searchData.substring(0, searchData.length - 1); //태그를 만들어 준다.
    }
    reloadTableData(makeCriteria(searchData, 10, nowPage));
}

/**
 * 링크 데이터 저장 버튼 함수
 * @returns
 */
async function clickModalBt4LinkDataSave() {
    const name = document.getElementById("saveTitle").value;
    const link = document.getElementById("saveLink").value;
    let tags = addItemTags.join(",");

    if (isNullValue(link)) {
        Swal.fire("링크", "링크 주소가 비어있습니다", "warning");
        return;
    }
    if (!isValidHttpUrl(link)) {
        Swal.fire("링크", "링크의 url 양식이 잘못되었습니다.", "error");
        return;
    }

    if (isNullValue(name)) {
        title = "Untitle : " + nowDate;
    }

    if (isNullValue(tags)) {
        tags = "";
    }

    try {
        await saveLinkData({ name: name, link: link, tags: tags }); //링크 저장 처리
        bootstrap.Modal.getInstance(addLinkModal).hide();
        Swal.fire("저장", "데이터가 저장되었습니다.", "success");
        resetInputField4AddLinkModal();
        reloadTableData(makeCriteria("", 10, 1)); //페이지 갱신
    } catch (error) {
        errorHandler4Promise(error);
    }
}

/**
 * 링크 데이터 삭제 버튼 함수
 * @param {*} idx 대상 row_id
 */
function clickBt4LinkDataDelete(idx) {
    Swal.fire({
        title: "항목 삭제",
        text: "해당 항목을 삭제하시겠습니까?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "삭제",
        cancelButtonText: "취소",
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await deleteLinkData4Idx(idx);
                reloadTableData(makeCriteria("", 10, nowPage)); //페이지 갱신 하며 현재 페이지로 이동
                Swal.fire("삭제", "삭제되었습니다.", "success");
            } catch (error) {
                errorHandler4Promise(error);
            }
        }
    });
}

/**
 * 링크 데이터 수정 모달을 띄운다.
 * @param {*} idx 대상 row_id
 * @param {*} name 링크 데이터 이름
 * @param {*} link  링크
 * @param {*} tags  태그
 */
function clickBt4LinkDataUpdate(idx, name = "", link = "", tags = "") {
    //모달 입력 부분을 초기화 해준다.
    resetInputField4AddLinkModal();

    //각 값을 지정해준다.
    doc.getElementById("saveTitle").value = name;
    doc.getElementById("saveLink").value = link;
    doc.getElementById("modalUpdateBt").setAttribute("data-idx", idx); //수정 버튼에 idx를 넣어준다.

    //태그 박스를 셋업 해준다.
    for (const tag of tags.split(",")) {
        addNewLinkTag(tag);
    }

    new bootstrap.Modal(doc.getElementById("addLinkModal")).show();
}

/**
 * 링크 데이터 수정 처리 버튼 함수
 * @returns
 */
async function clickModalBt4LinkDataUpdate() {
    const idx = doc.getElementById("modalUpdateBt").getAttribute("data-idx");
    const title = doc.getElementById("saveTitle").value;
    const link = doc.getElementById("saveLink").value;
    var selectTags = addItemTags.join(",");

    if (isNullValue(link)) {
        Swal.fire("링크", "링크 주소가 비어있습니다", "warning");
        return;
    }
    if (!isValidHttpUrl(link)) {
        Swal.fire("링크", "링크의 url 양식이 잘못되었습니다.", "error");
        return;
    }

    if (isNullValue(title)) {
        title = "Untitle : " + nowDate;
    }

    if (isNullValue(selectTags)) {
        selectTags = "";
    }

    //////////////////////
    try {
        //업데이트 처리
        bootstrap.Modal.getInstance(addLinkModal).hide();
        await updateLinkData(idx, title, link, selectTags);

        Swal.fire("수정", "데이터가 수정되었습니다.", "success");
        resetInputField4AddLinkModal();

        //데이터 새로 갱신처리 해주기
        reloadTableData(makeCriteria("", 10, nowPage)); //페이지 갱신
    } catch (error) {
        console.log("error = " + JSON.stringify(error));
        errorHandler4Promise(error);
    }
}

//////////////////////////////
//      데이터 초기화
//////////////////////////////

/**
 * 현재 저장된 데이터를 모두 초기화 해주는 함수
 */
function resetAllData() {
    Swal.fire({
        title: "초기화",
        text: "데이터를 초기화 하시겠습니까?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "초기화",
        cancelButtonText: "취소",
    }).then(async (result) => {
        if (result.isConfirmed) {
            await deleteLinkData4All(); //LinkData 초기화 처리
            await deleteTagData4All(); //TagData 초기화 처리
            resetDefaultValue(); //기본값 초기화
            resetInputField4AddLinkModal(); //
            reloadTableData(makeCriteria("", 10, 1)); //페이지 갱신
            Swal.fire("초기화", "초기화되었습니다.", "success");
        }
    });
}

//////////////////////////////
//      Data handler
//////////////////////////////

/**
 * 테이블 데이터를 리셋하고 다시 불러오는 함수
 * @param {*} criteria 검색 및 테이블 데이터 조회에 사용되는 criteria
 */
function reloadTableData(criteria) {
    //테이블 리셋
    let rowCnt = document
        .getElementById("linkTable")
        .getElementsByTagName("tbody")[0]
        .querySelectorAll("tr").length;

    //행을 지우는 부분
    if (rowCnt !== 0) {
        while (1) {
            if (rowCnt === 0) {
                break;
            }
            document.querySelector("table").deleteRow(rowCnt);
            rowCnt--;
        }
    }

    setPageCriteriaData4Table(criteria);
}

/**
 * LinkData 추가 모달의 입력 필드를 초기화 해주는 함수
 */
function resetInputField4AddLinkModal() {
    document.getElementById("saveTitle").value = "";
    document.getElementById("saveLink").value = "";
    resetTagBox(); //태그 박스를 비워준다.
}

//////////////////////////////
//     Bootstrap Modal
//////////////////////////////

//Open Modal
addLinkModal.addEventListener("show.bs.modal", function (event) {
    if (isNullValue(event.relatedTarget)) {
        //없는 경우 업데이트 모달로 간주하고 값을 처리해준다
        doc.getElementById("modalUpdateBt").style.display = "block";
        doc.getElementById("modalSaveBt").style.display = "none";

        doc.getElementById("addLinkModalLabel").innerText = "링크 수정";
        doc.getElementById("modalSaveBt").innerText = "수정";
    } else {
        //존재하는 경우 추가 또는 기타
        const openType = event.relatedTarget.getAttribute("data-bs-send-type");

        //새로 추가하는 부분
        if (openType === "LinkDataAdd") {
            resetInputField4AddLinkModal();
        }
    }
});

//Close Modal event
addLinkModal.addEventListener("hide.bs.modal", function (event) {
    document.getElementById("addLinkModalLabel").innerText = "링크 등록";
    document.getElementById("modalSaveBt").innerText = "저장";

    document.getElementById("modalUpdateBt").style.display = "none";
    document.getElementById("modalSaveBt").style.display = "block";
});

//////////////////////////////
//       View Utils
//////////////////////////////
//라벨 색상 랜덤으로 뽑아주는 함수
function getRandomLabelColor() {
    const colorCode = rand(0, 5);
    if (colorCode === 0) {
        return "bg-secondary";
    } else if (colorCode === 1) {
        return "bg-success";
    } else if (colorCode === 2) {
        return "bg-danger";
    } else if (colorCode === 3) {
        return "bg-warning";
    } else if (colorCode === 4) {
        return "bg-info";
    } else if (colorCode === 5) {
        return "bg-dark";
    } else {
        return "bg-primary";
    }
}

/**
 * 공통적으로 사용하는 변수들을 모두 초기화
 */
function resetDefaultValue() {
    limit = 10;
    nowPage = 1; //현재 페이지 (가변적)
    totalPage = 0; //총 페이지 (가변적)
    totalItemCnt = 0; //총 아이템 갯수
    searchType = "name";
    searchData = "";
}
