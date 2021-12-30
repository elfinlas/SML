/**
 * Backup 과 Restore 담당
 */

const fs = require("fs");

//////////////////////////////
//      데이터 복원
//////////////////////////////

/**
 * 복원 데이터를 만드는 함수
 */
async function makeRestoreDate() {
    //한번 물어본다

    Swal.fire({
        title: "데이터 백업",
        text: "현재 저장된 데이터를 백업하시겠습니까?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "백업",
        cancelButtonText: "취소",
    }).then(async (result) => {
        if (result.isConfirmed) {
            let bakData = { link_data: [], tag_data: [] }; //JSON으로 저장될 데이터

            //태그 데이터 백업 생성
            const tagData = await getTagData4All();
            const linkData = await getLinkData4OrderByUpdateDateDesc();

            bakData.tag_data = tagData["data"];
            bakData.link_data = linkData["data"];

            //날짜 형식을 가져오는 부분
            let nowDate = getNowDateStr();
            let date = nowDate.split(" ")[0];
            let time = nowDate.split(" ")[1];

            //가져온 날짜로 양식을 만들어주는 부분
            date = date.substring(2, date.length).replace(/-/g, "");
            time = time.replace(/:/g, "");

            ///
            //경로가 없는 경우 생성
            if (!fs.existsSync(localPath)) {
                fs.mkdirSync(localPath);
            }

            //Write Json File
            const savePath = path.join(
                localPath,
                path.sep + "bak_" + date + "-" + time + ".json"
            );

            fs.writeFileSync(savePath, JSON.stringify(bakData));
            Swal.fire({
                title: "백업 데이터 생성",
                html: "현재 경로에 복원 파일을 생성하였습니다. <br>" + savePath,
                icon: "success",
            });
        }
    });
}

/**
 * 백업된 JSON 데이터를 복원 처리하는 함수
 */
async function click4RestoreData() {
    const dataCnt = await getCount4AllLinkData();

    if (dataCnt["data"] !== 0) {
        Swal.fire("복원 실패", "데이터가 없을 때 복원 가능합니다.", "error");
        return;
    }

    const jsonStr = document.getElementById("restoreJsonTextArea").value;

    if (isNullValue(jsonStr)) {
        Swal.fire("복원 데이터", "복원 데이터 값이 공백입니다.", "error");
        return;
    }

    if (!isValidJson(jsonStr)) {
        Swal.fire(
            "복원 데이터",
            "복원 데이터의 JSON 형식이 잘못되었습니다.",
            "error"
        );
        return;
    }

    var jsonArr = JSON.parse(jsonStr);
    for (const item of jsonArr.tag_data) {
        try {
            await saveTagData(item);
        } catch (error) {
            errorHandler4Promise(error);
        }
    }

    for (const item of jsonArr.link_data) {
        try {
            await saveLinkData(item);
        } catch (error) {
            errorHandler4Promise(error);
        }
    }

    Swal.fire("복원 데이터", "복원에 성공하였습니다.", "success");
    bootstrap.Modal.getInstance(restoreDataModal).hide();

    document.getElementById("restoreJsonTextArea").value = "";

    resetDefaultValue(); //기본값 초기화

    //테이블 데이터를 리셋
    reloadTableData(makeCriteria(searchData, 10, 1)); //1페이지로 이동
}
