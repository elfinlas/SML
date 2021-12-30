/**
 * Link Tag 관련 처리를 담당
 */

var addItemTags = []; //태그 새롭게 담을 배열
var addLinkTagSelectObj; //LinkTagSelect의 choices Object가 들어가는 변수
var searchLinkTagSelectObj; //

/**
 * 셀렉트에 들어갈 데이터는 배열로 받아서 처리
 * 버튼을 눌렀을 때 저장된
 */

/**
 * choices.js 를 사용하는 select를 초기화 해주는 함수
 */
function initWithSelectTag() {
    const searchLinkTagSelect = doc.getElementById("search_link_tag_select");

    //검색창
    searchLinkTagSelectObj = new Choices(searchLinkTagSelect, {
        itemSelectText: "",
        shouldSort: false,
        callbackOnInit: () => {},
    });

    //링크 데이터 추가 모달에서 사용되는 셀렉트
    const addLinkTagSelect = doc.getElementById("add_link_tag_select");

    //링크 데이터 추가 모달 안의 태그 추가 셀렉트
    addLinkTagSelectObj = new Choices(addLinkTagSelect, {
        placeholder: true,
        placeholderValue: "Placeholder",
        itemSelectText: "",
        shouldSort: false,
        callbackOnInit: () => {},
    });

    //태그 변화 할 때
    addLinkTagSelect.addEventListener(
        "change",
        function (event) {
            //값이 변할 때  0으로 값을 바꿔준다.
            addLinkTagSelectObj.setChoiceByValue("저장된 태그를 선택하세요."); // Choice with value of 'Two' has now been selected.

            //선택 값을 등록 처리
            addNewLinkTag(event.detail.value); //
        },
        true
    );

    //선택할 때
    addLinkTagSelect.addEventListener("choice", function (event) {}, true);
}

//////////////////////////////
//  Add & Update Modal input 관련
//////////////////////////////

/**
 * 링크 추가 모달 안의 input 태그 부분 이벤트 함수
 * @returns
 */
function addTag4Modal() {
    if (window.event.keyCode == 13) {
        // 엔터키가 눌렸을 때 실행할 내용
        let inputTag = doc.getElementById("add_link_tag_input");
        const inputTagValue = inputTag.value;
        inputTag.value = ""; //태그 입력란을 비워준다.

        if (!isNullValue(inputTagValue)) {
            addNewLinkTag(inputTagValue);
        } else {
            //aaaaaa
        }
    }
}

//새로운 링크 태그를 등록 처리하는 부분
function addNewLinkTag(tag) {
    if (addItemTags.indexOf(tag) !== -1) {
        //배열에 등록된 것인지 체크
        Swal.fire("링크 태그 추가", "이미 등록된 태그입니다.", "error");
        return;
    }

    addItemTags.push(tag); //배열에 넣는다.

    //밑의 태그박스에 등록해준다.
    doc.getElementById("tagbox").innerHTML += makeHtml4TagDataInModal(tag);
}

//링크 박스 안에 있는 태그에서 X(삭제) 버튼 누른 경우
function clickModalBt4LinkTagDel(tag) {
    if (addItemTags.length === 0 || addItemTags.indexOf(tag) === -1) {
        Swal.fire(
            "링크 태그 삭제",
            "삭제에 실패했습니다. (잘못된 값).",
            "error"
        );
        return;
    }

    //배열에서 먼저 삭제해준다.
    addItemTags.splice(addItemTags.indexOf(tag), 1);

    //html 태그를 지워준다.
    doc.getElementById("add-tag-span-" + tag).remove();
}

/**
 * 입력 모달에서 태그 값의 html을 만들어주는 함수
 * @param {*} tag
 * @returns
 */
function makeHtml4TagDataInModal(tag) {
    const colorCode = getRandomLabelColor();
    return `<span id="add-tag-span-${tag}" class="badge rounded-pill ${colorCode}">${tag}<button type="button" class="btn badge rounded-pill ${colorCode}" onclick="clickModalBt4LinkTagDel('${tag}')">X</button></span> `;
}

//데이터 등록 부분 ******
/**
 * 링크 데이터 추가 모달의 select 데이터 추가
 * @param {*} data
 */
function setData4AddLinkTagSelect(data) {
    let tmpLinkData = [];
    let tmpSearchTagData = [];

    //초기화를 진행한다.
    addLinkTagSelectObj.clearChoices();
    searchLinkTagSelectObj.clearChoices();

    tmpLinkData.push({
        value: "0",
        label: "저장된 태그를 선택하세요.",
        selected: true,
        disabled: true,
    });

    for (const item of data) {
        if (!isNullValue(item.tag)) {
            //빈 태그는 추가하지 않는다.
            tmpLinkData.push({ value: item.row_id, label: item.tag });
            tmpSearchTagData.push({ value: item.row_id, label: item.tag });
        }
    }

    addLinkTagSelectObj.setChoices(tmpLinkData, "label", false);
    searchLinkTagSelectObj.setChoices(tmpSearchTagData, "label", false); //검색 박스 부분도 같이 초기화
}

//태그 박스를 리셋하는 함수
function resetTagBox() {
    const tagBox = doc.querySelector("#tagbox"); //부모 객체
    while (tagBox.hasChildNodes()) {
        //삭제
        tagBox.removeChild(tagBox.firstChild);
    }
    addItemTags = []; //배열 비워준다.

    addLinkTagSelectObj.setChoiceByValue("저장된 태그를 선택하세요.");
    doc.getElementById("add_link_tag_input").value = "";
}
