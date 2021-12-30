/**
 * SQLite Databae 처리 담당
 */

//
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

///// Variable

///localPath
const TABLE_LINK_DATA = "link_data";
const TABLE_TAG_DATA = "tag_data";

//////////////////////////////
//             INIT
//////////////////////////////

/**
 * SQLite init 함수
 * @returns
 */
async function initWithDB() {
    const rootPath = require("electron-root-path").rootPath;
    const DB_FILE_NAME = path.join(rootPath, path.sep + "dbfile.db");

    return new Promise((resolve, reject) => {
        try {
            db = new sqlite3.Database(
                DB_FILE_NAME,
                sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
                (err) => {
                    if (err) {
                        Swal.fire({
                            title: "DB Init error",
                            text: "err.message = " + err,
                            icon: "error",
                        });
                    } else {
                        db.run(
                            "CREATE TABLE IF NOT EXISTS " +
                                TABLE_LINK_DATA +
                                " (row_id integer primary key autoincrement, name TEXT, link TEXT NOT NULL, tags TEXT, create_date datetime, update_date datetime)"
                        );
                        db.run(
                            "CREATE TABLE IF NOT EXISTS " +
                                TABLE_TAG_DATA +
                                " (row_id integer primary key autoincrement, tag TEXT NOT NULL, UNIQUE(tag))"
                        );
                    }
                }
            );
            resolve(makeDefaultBody4Success());
        } catch (error) {
            reject(
                makeDefaultBody4Fail({
                    error_msg: "[initWithDB]-error = " + error,
                })
            );
        }
    });
}

//////////////////////////////
//    CRUD 4 Tag Data
//////////////////////////////

/**
 * tag 데이터를 저장 처리하는 함수 (async await)
 * @param {*} entity (Object 4 tag)
 */
async function saveTagData(entity) {
    return new Promise((resolve, reject) => {
        try {
            db.serialize(() => {
                db.run(
                    `INSERT OR IGNORE INTO ${TABLE_TAG_DATA}(tag) VALUES ('${entity.tag}')`
                );
            });
            resolve(makeDefaultBody4Success());
        } catch (error) {
            reject(makeDefaultBody4Fail({ error_mgs: error }));
        }
    });
}

/**
 * 태그 데이터 전부 조회하는 함수 (async await)
 * @returns Promise object return
 */
async function getTagData4All() {
    return new Promise((resolve, reject) => {
        let tagData = [];
        db.serialize(() => {
            db.all(
                `SELECT * from ${TABLE_TAG_DATA} order by row_id ASC`,
                (err, row) => {
                    if (err) {
                        reject(makeDefaultBody4Fail({ error_msg: err }));
                    }
                    row.forEach((item) => {
                        tagData.push({
                            row_id: `${item.row_id}`,
                            tag: `${item.tag}`,
                        });
                    });
                    resolve(makeDefaultBody4Success({ data: tagData }));
                }
            );
        });
    });
}

/**
 * Tag Data 테이블 초기화 함수 (async await)
 */
async function deleteTagData4All() {
    return new Promise((resolve, reject) => {
        try {
            db.serialize(() => {
                db.run(`DELETE FROM ${TABLE_TAG_DATA}`);
                db.run(
                    `UPDATE SQLITE_SEQUENCE SET seq = 0 WHERE name = '${TABLE_TAG_DATA}';`
                );
            });
            resolve(makeDefaultBody4Success());
        } catch (error) {
            reject(
                makeDefaultBody4Fail({
                    error_msg: "Tag table 초기화에 실패하였습니다." + error,
                })
            );
        }
    });
}

//////////////////////////////
//    CRUD 4 Link Data
//////////////////////////////

/**
 * 링크 데이터를 저장하는 함수
 * @param {*} entity
 * @returns
 */
async function saveLinkData(entity) {
    //전달된 값의 존재 여부를 체크
    return new Promise(async (resolve, reject) => {
        let nowDate = getNowDateStr(); //오늘 날짜 가져옴
        try {
            let existResult = await isExistLinkData4Link(entity.link);

            if (isSuccessPromise(existResult)) {
                //존재 여부 결과 성공
                //정상인 경우 태그 데이터를 먼저 넣어준다
                for (const item of entity.tags.split(",")) {
                    await saveTagData({ tag: item });
                }
                //링크 데이터 저장
                db.each(
                    `INSERT INTO ${TABLE_LINK_DATA}(name, link, tags, create_date, update_date) VALUES ('${entity.name}', '${entity.link}', '${entity.tags}', '${nowDate}', '${nowDate}')`
                );
                return resolve(makeDefaultBody4Success());
            } else {
                //만약 값이 이미 존재하거나 DB 조회 에러인 경우
                reject(makeDefaultBody4Fail({ error_msg: existResult }));
            }
        } catch (err) {
            if (err.hasOwnProperty("swal")) {
                err.swal;
            } else {
                reject(makeDefaultBody4Fail({ error_msg: err }));
            }
        }
    });
}

///////////////

/**
 * 역순으로 값을 가져오는 부분
 */
async function getLinkData4OrderByUpdateDateDesc() {
    return new Promise((resolve, reject) => {
        try {
            db.all(
                `SELECT * from ${TABLE_LINK_DATA} order by update_date DESC`,
                (err, row) => {
                    if (err) {
                        reject(makeDefaultBody4Fail({ error_msg: err }));
                    } else {
                        resolve(makeDefaultBody4Success({ data: row }));
                    }
                }
            );
        } catch (error) {
            reject(
                makeDefaultBody4Fail({
                    error_msg:
                        "[getLinkData4OrderByUpdateDateDesc]-error = " + error,
                })
            );
        }
    });
}

/**
 * LinkData에 저장된 카운트 값을 가져온다.
 * @returns
 */
async function getCount4AllLinkData() {
    return new Promise((resolve, reject) => {
        try {
            db.all(`SELECT COUNT(*) FROM ${TABLE_LINK_DATA} `, (err, row) => {
                if (err) {
                    reject(makeDefaultBody4Fail({ error_msg: err }));
                } else {
                    resolve(
                        makeDefaultBody4Success({ data: row[0]["COUNT(*)"] })
                    );
                }
            });
        } catch (error) {
            reject(
                makeDefaultBody4Fail({
                    error_msg: "[getCount4AllLinkData]-error = " + error,
                })
            );
        }
    });
}

/**
 * 이름으로 검색한 카운트를 구한다
 * @param {*} name
 * @returns
 */
async function getCount4LinkDataName(name = "") {
    return new Promise((resolve, reject) => {
        try {
            db.all(
                `SELECT COUNT(*) FROM ${TABLE_LINK_DATA} WHERE name LIKE '%${name}%'`,
                (err, row) => {
                    if (err) {
                        reject(makeDefaultBody4Fail({ error_msg: err }));
                    } else {
                        resolve(
                            makeDefaultBody4Success({
                                data: row[0]["COUNT(*)"],
                            })
                        );
                    }
                }
            );
        } catch (error) {
            reject(
                makeDefaultBody4Fail({
                    error_msg: "[getCount4LinkDataName]-error = " + error,
                })
            );
        }
    });
}

//
async function getCount4LinkDataTag(tag) {
    return new Promise((resolve, reject) => {
        try {
            let tmpTags = tag.split(",");

            let sql = `SELECT COUNT(*) FROM ${TABLE_LINK_DATA} WHERE`;
            for (const target of tmpTags) {
                sql += ` tags LIKE '%${target}%' OR`;
            }

            sql = sql.substring(0, sql.length - 2);

            db.all(sql, (err, row) => {
                if (err) {
                    reject(makeDefaultBody4Fail({ error_msg: err }));
                } else {
                    resolve(
                        makeDefaultBody4Success({
                            data: row[0]["COUNT(*)"],
                        })
                    );
                }
            });
        } catch (error) {
            reject(
                makeDefaultBody4Fail({
                    error_msg: "[getCount4LinkDataName]-error = " + error,
                })
            );
        }
    });
}

/**
 * 링크 데이터를 이름 검색과 페이징 처리를 해서 값을 조회하는 함수
 * @param {*} name
 * @param {*} limit
 * @param {*} currentPage
 * @returns
 */
async function getLinkDataPage4Name(name = "", limit = 10, currentPage = 1) {
    return new Promise((resolve, reject) => {
        const offset = (currentPage - 1) * limit; //Offset
        try {
            db.all(
                `SELECT * FROM ${TABLE_LINK_DATA} WHERE name LIKE '%${name}%' ORDER BY create_date DESC LIMIT ${limit} OFFSET ${offset}`,
                (err, row) => {
                    if (err) {
                        reject(makeDefaultBody4Fail({ error_msg: err }));
                    } else {
                        resolve(makeDefaultBody4Success({ data: row }));
                    }
                }
            );
        } catch (error) {
            reject(
                makeDefaultBody4Fail({
                    error_msg: "[getLinkDataPage4Name]-error = " + error,
                })
            );
        }
    });
}

/**
 * 링크 데이터를 태그 검색과 페이징 처리를 해서 값을 조회하는 함수
 * @param {*} tag
 * @param {*} limit
 * @param {*} currentPage
 * @returns
 */
async function getLinkDataPage4Tag(tag = "", limit = 10, currentPage = 1) {
    return new Promise((resolve, reject) => {
        const offset = (currentPage - 1) * limit; //Offset
        try {
            let tmpTags = tag.split(",");

            let sql = `SELECT * FROM ${TABLE_LINK_DATA} WHERE`;
            for (const target of tmpTags) {
                sql += ` tags LIKE '%${target}%' OR`;
            }

            sql = sql.substring(0, sql.length - 2);
            sql += ` ORDER BY create_date DESC LIMIT ${limit} OFFSET ${offset}`;

            db.all(sql, (err, row) => {
                if (err) {
                    reject(makeDefaultBody4Fail({ error_msg: err }));
                } else {
                    resolve(makeDefaultBody4Success({ data: row }));
                }
            });
        } catch (error) {
            reject(
                makeDefaultBody4Fail({
                    error_msg: "[getLinkDataPage4Tag]-error = " + error,
                })
            );
        }
    });
}

/**
 * 저장된 link data 모두를 가져오는 함수
 * @param {*} resolve
 */
async function getLinkData4All() {
    return new Promise((resolve, reject) => {
        let data = [];

        try {
            db.all(
                `SELECT * from ${TABLE_LINK_DATA} order by create_date ASC`,
                (err, row) => {
                    if (err) {
                        reject(
                            makeDefaultBody4Fail({
                                error_msg:
                                    "[getLinkData4All] - 조회 SQL에 실패했습니다. (" +
                                    error +
                                    ")",
                            })
                        );
                    } else {
                        row.forEach((item) => {
                            data.push({
                                row_id: `${item.row_id}`,
                                name: `${item.name}`,
                                link: `${item.link}`,
                                tags: `${item.tags}`,
                                create_date: `${item.create_date}`,
                                update_date: `${item.update_date}`,
                            });
                        });
                        resolve(makeDefaultBody4Success({ data: data }));
                    }
                }
            );
        } catch (error) {
            reject(
                makeDefaultBody4Fail({
                    error_msg:
                        "Link 데이터 전체 조회에 실패했습니다. (" + error + ")",
                })
            );
        }
    });
}

/**
 * LinkData Update
 */
async function updateLinkData(row_id, name, link, tags) {
    return new Promise(async (resolve, reject) => {
        //태그 먼저 처리해준다.
        for (const item of tags.split(",")) {
            await saveTagData({ tag: item });
        }

        let existResult;
        try {
            existResult = await isExistLinkData4Link(link);
        } catch (error) {
            existResult = error;
        }
        try {
            if (!isSuccessPromise(existResult)) {
                if (existResult.hasOwnProperty("data")) {
                    //값을 가지고 있는 경우
                    const dbRowId = Number(existResult["data"].row_id);
                    const sendRowId = Number(row_id);

                    if (dbRowId !== sendRowId) {
                        throw new Error(existResult);
                    }
                }
            }

            db.each(
                `UPDATE ${TABLE_LINK_DATA} SET name='${name}', link='${link}', tags='${tags}', update_date='${getNowDateStr()}' WHERE row_id='${row_id}'`
            );
            resolve(makeDefaultBody4Success());
        } catch (error) {
            reject(
                makeDefaultBody4Fail({
                    error_msg:
                        "Link 데이터 수정에 실패했습니다. (" + error + ")",
                })
            );
        }
    });
}

/**
 * Link 데이터 삭제
 * @param {*} row_id 삭제할 대상 id
 */
async function deleteLinkData4Idx(row_id) {
    return new Promise((resolve, reject) => {
        try {
            db.serialize(() => {
                db.run(`DELETE FROM ${TABLE_LINK_DATA} WHERE row_id=${row_id}`);
            });
            resolve(makeDefaultBody4Success());
        } catch (error) {
            reject(
                makeDefaultBody4Fail({
                    error_msg:
                        "Link 데이터(" +
                        row_id +
                        ") 삭제에 실패했습니다" +
                        error,
                })
            );
        }
    });
}

/**
 * LinkData 초기화 처리 (데이터 다 날리는 것으로 신중하게 호출해야 함)
 */
async function deleteLinkData4All() {
    return new Promise((resolve, reject) => {
        try {
            db.serialize(() => {
                db.run(`DELETE FROM ${TABLE_LINK_DATA}`);
                db.run(
                    `UPDATE SQLITE_SEQUENCE SET seq = 0 WHERE name = '${TABLE_LINK_DATA}';`
                );
            });
            resolve(makeDefaultBody4Success());
        } catch (error) {
            reject(
                makeDefaultBody4Fail({
                    error_msg: "Link table 초기화에 실패하였습니다." + error,
                })
            );
        }
    });
}

/**
 * Link 가 저장되어 있는지 체크하는 함수 (async await)
 * @param {*} target_link
 * @returns
 */
async function isExistLinkData4Link(target_link) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.all(
                `SELECT * FROM ${TABLE_LINK_DATA} WHERE link='${target_link}'`,
                (err, row) => {
                    if (err) {
                        //에러가 발생한 경우
                        reject(
                            makeDefaultBody4Fail({
                                error_msg: err,
                            })
                        );
                    } else {
                        if (isEmptyKeyValueObj(row)) {
                            resolve(makeDefaultBody4Success());
                        } else {
                            if (row.length >= 2) {
                                //2개 이상은 error
                                reject(
                                    makeDefaultBody4Fail({
                                        error_mgs:
                                            "데이터가 2개 이상 조회되었습니다.",
                                        swal: Swal.fire(
                                            "조회 실패",
                                            "데이터가 2개 이상 조회되었습니다.",
                                            "error"
                                        ),
                                    })
                                );
                            } else {
                                //1개가 이미 있는 경우
                                reject(
                                    makeDefaultBody4Fail({
                                        error_mgs:
                                            "이미 저장된 링크가 존재합니다.",
                                        swal: Swal.fire({
                                            title: "저장 불가",
                                            html:
                                                "이미 저장된 링크가 존재합니다. <br>" +
                                                "[제목] = " +
                                                row[0].name +
                                                "<br> [등록일] = " +
                                                row[0].create_date +
                                                "",
                                            icon: "error",
                                        }),
                                        data: row[0],
                                    })
                                );
                            }
                        }
                    }
                }
            );
        });
    });
}
