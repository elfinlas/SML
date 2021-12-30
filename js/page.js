//////////////////////////////
//          Page
//////////////////////////////

//페이지에 맞는 데이터를 가져와야 하는 함수 필요
function click4PageNumber(pageNum = 1) {
    //동일 페이지인 경우 이동을 막는다
    if (nowPage === pageNum) {
        return;
    }
    nowPage = pageNum;

    const criteria = makeCriteria(searchData, 10, nowPage);
    reloadTableData(criteria);
    setupPageData(criteria);
}

/**
 * 하단 페이지 데이터를 처리해주는 함수
 * @param {*} criteria 검색 조건과 페이징을 위한 객체
 */
function setupPageData(criteria = {}) {
    //총 페이지를 구해온다.
    setTotalPage(criteria);

    //기본 값이 처리된 이후 동작이 수행되는것을 보장하기 위해 타이머 처리
    setTimeout(() => {
        doc.getElementById("totalItemCnt").innerText = totalItemCnt + "건";

        const pageItemField = doc.getElementById("pageItem");

        //페이징 처리에 작업이 된 자식 노드 삭제
        const tmpPageField = doc.querySelector("#pageItem");
        while (tmpPageField.hasChildNodes()) {
            tmpPageField.removeChild(tmpPageField.firstChild);
        }

        let pageViewHtml = ""; //새롭게 페이징 처리를 위해 만들어주는 것

        //First
        pageViewHtml += `<li id="firstPageItem" class="page-item ${
            !isCanMoveFirst() ? "disabled" : ""
        }"><a class="page-link" href="javascript:click4PageNumber(1)" aria-label="Previous"><span aria-hidden="true">FIRST</span></a></li>`;

        //<< 이전 버튼 (현재 페이지에 따라서 값이 바뀜)
        if (nowPage <= 1) {
            pageViewHtml += `<li class="page-item disabled">`;
        } else {
            pageViewHtml += `<li class="page-item">`;
        }
        pageViewHtml += `<a class="page-link" href="javascript:click4PageNumber(${
            nowPage - 1
        })" aria-label="Previous"><span aria-hidden="true">&laquo;</span> </a> </li>`;

        //센터 숫자
        const tmpPageStartNum = Math.floor(nowPage / 10) + 1;
        const tmpPageLastNum =
            totalPage > 10 ? tmpPageStartNum + 10 : totalPage;

        //숫자 적는 부분
        for (
            let pageNumber = tmpPageStartNum;
            pageNumber <= tmpPageLastNum;
            pageNumber++
        ) {
            if (Number(nowPage) === Number(pageNumber)) {
                pageViewHtml += `<li class="page-item link active">`;
            } else {
                pageViewHtml += `<li class="page-item">`;
            }
            pageViewHtml += `<a class="page-link" href="javascript:click4PageNumber(${pageNumber})">${pageNumber}</a></li>`;
        }

        //>> 다음 버튼
        if (nowPage >= totalPage) {
            pageViewHtml += `<li class="page-item disabled">`;
        } else {
            pageViewHtml += `<li class="page-item">`;
        }
        pageViewHtml += `<a class="page-link" href="javascript:click4PageNumber(${
            nowPage + 1
        })" aria-label="Previous"><span aria-hidden="true">&raquo;</span> </a> </li>`;

        //Last
        pageViewHtml += `<li id="lastPageItem" class="page-item ${
            !isCanMoveLast() ? "disabled" : ""
        }"><a class="page-link" href="javascript:click4PageNumber(${totalPage})" aria-label="Previous"><span aria-hidden="true">LAST</span></a></li>`;

        pageItemField.insertAdjacentHTML("afterbegin", pageViewHtml);
    }, 80);
}

/**
 * 총 페이지 수를 구해주는 함수
 * @param {*} criteria
 */
async function setTotalPage(criteria) {
    try {
        let tmpCnt = 0;
        if (!isNullValue(criteria["search"])) {
            if (searchType === "tag") {
                tmpCnt = await getCount4LinkDataTag(criteria["search"]);
            } else {
                tmpCnt = await getCount4LinkDataName(criteria["search"]);
            }
        } else {
            //검색 조건에 아무것도 없다면?
            tmpCnt = await getCount4AllLinkData();
        }

        totalItemCnt = tmpCnt["data"];

        totalPage = Math.floor(
            Number(tmpCnt["data"]) / limit +
                (Number(tmpCnt["data"]) % limit !== 0 ? 1 : 0)
        );
    } catch (error) {
        errorHandler4Promise(error);
    }
}

/**
 * 처음으로 이동이 가능한 상태인가?
 * @returns
 */
function isCanMoveFirst() {
    return Number(nowPage) >= 2;
}

/**
 * 마지막으로 이동이 가능한 상태인가?
 * @returns
 */
function isCanMoveLast() {
    return nowPage < totalPage;

    // return Number(totalPage) !== Number(nowPage);
}

/**
 * 검색용 전달 criteria를 만들어주는 함수
 * @param {*} searchWord
 * @param {*} limit
 * @param {*} currentPage
 * @returns
 */
function makeCriteria(searchWord = "", limit = 10, currentPage = 1) {
    return { search: searchWord, limit: limit, currentPage: currentPage };
}
