const { createCanvas, loadImage, registerFont } = require('canvas')

registerFont('./fonts/SourceHanSerif-Bold.otf', { family: 'HanSerifBold' });

// 環境変数的な
const postcardH = 1480;
const postcardW = 1000;
const addrFontFamily = "HanSerifBold";
const dashes = "-–−ー－";
let DEBUG_MODE = false;

var testCanvas = createCanvas(postcardH, postcardW);
// ごあいさん提供コード
function getWidth(target_letters, font_family, font_size) {
    let canvas_ctx = testCanvas.getContext("2d");
    canvas_ctx.font = `${font_size}px ${font_family}`;
    const metrics = canvas_ctx.measureText(target_letters);
    return metrics.width;
}

function getHeight(target_letters, font_family, font_size) {
    let canvas_ctx = testCanvas.getContext("2d");
    canvas_ctx.font = `${font_size}px ${font_family}`;
    const metrics = canvas_ctx.measureText(target_letters);
    if (target_letters.indexOf("一") != -1) {
        return (
            metrics.actualBoundingBoxAscent +
            metrics.actualBoundingBoxDescent +
            (font_size / 10) * 7
        );
    } else {
        return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    }
}

function rotateCanvas(_ctx, degree, x_offset, y_offset) {
    // x_offset,y_offsetを中心にdegree度(度数法)回転させたキャンバスを返します
    _ctx.translate(x_offset, y_offset);
    _ctx.rotate((degree * Math.PI) / 180);
    _ctx.translate(-x_offset, -y_offset);
    return _ctx;
}

// 画像生成
exports.func = function(jsonData) {
    var debugX = 0;
    if("option" in jsonData){
        if("debugmode" in jsonData["option"]){
            DEBUG_MODE = jsonData["option"]["debugmode"];
        }
        if("debugNumX" in jsonData["option"]){
            debugX = jsonData["option"]["debugNumX"]
        }
    }
    console.log(jsonData)
    var canvas = createCanvas(postcardH, postcardW);  // 640x480の空のキャンバスを作る
    let context = canvas.getContext("2d");
    context.clearRect(0, 0, postcardW, postcardH);

    function writePostCode(postCode, x, y, letterWidth, fontSize, Pref_CityWidth) {
        context.save();
        context.font = `${fontSize}px ${addrFontFamily}`;
        context.textBaseline = "alphabetic";
        context.translate(x, y);

        const postCodeArr = postCode.split("");

        postCodeArr.forEach((postCodeNum, i) => {
            const codePref_City = i >= 3 ? Pref_CityWidth : 0;
            context.fillText(postCodeNum, codePref_City + letterWidth * i, 0);
        });
        context.restore();
    }

    // 郵便番号
    const postCode = jsonData["to"]["postCode"];
    writePostCode(postCode, 455, 176, 65, 55, 15);

    // 住所
    let addrFontSize;
    const addrTextH = 800;
    const addrFontSizeList = [
        53, 50, 47, 44, 41, 39, 36, 33, 30, 27, 24, 21, 19, 16, 13, 10, 7, 4, 1,
    ];

    const addr_raw = jsonData["to"]["addr"];
    let dash;
    if("option" in jsonData){
        if("dash" in jsonData["option"]){
            dash = jsonData["option"]["dash"];
        }
        dash = "2212";
    } else {
        dash = "2212";
    }
    //console.log(dash);

    const dash_regex = /[-–−－]/g;
    const addr = addr_raw.replace(dash_regex, String.fromCharCode(parseInt(dash, 16)));

    let newLine = [0];
    let addrH = 0;
    for (h = 0; h < addrFontSizeList.length; h++) {
        for (i = 0; i < addr.length; i++) {
            const textH = getHeight(addr[i], addrFontFamily, addrFontSizeList[h]);
            //console.log(textH);
            addrH += textH;
            //console.log(addrH)
            if (addrH > addrTextH) {
                newLine.push([i - 1]);
                //console.log(newLine);
                addrH = textH;
            }
        }
        if (newLine.length < 3) {
            addrFontSize = addrFontSizeList[h];
            break;
        } else {
            addrH = 0;
            newLine = [0];
        }
    }
    //console.log(addrFontSize)
    //console.log(newLine)
    const addrArray = addr.split("");
    let addrArrayDaraw = [];
    for (i = 0; i < newLine.length; i++) {
        addrArrayDaraw.push(addrArray.slice(newLine[i], newLine[i + 1]));
    }
    //console.log(addrArrayDaraw);

    function writeVertical(lines, fontFamily, fontSize, x, y, lineSpacingX, lineSpacingY) {
        let addrH = y;
        let addrWL = 1;
        const standardW = getWidth("あ", fontFamily, fontSize);
        const standardH = getHeight("あ", fontFamily, fontSize);

        context.font = `${fontSize}px ${fontFamily}`;
        context.textBaseline = "middle";

        lines.forEach((addrField) => {
            addrField.forEach((outputTxt) => {
                const outputTxtW = getWidth(outputTxt, fontFamily, fontSize);
                const outputTxtH = getHeight(outputTxt, fontFamily, fontSize);

                if (dashes.includes(outputTxt)) {
                    const textX =
                        x -
                        (standardW + lineSpacingX) * (addrWL + 1) +
                        (standardW - outputTxtW) / 2;
                    const textY = addrH + outputTxtW / 2;

                    const rotateCenterX =
                        x -
                        (standardW + lineSpacingX) * (addrWL + 1) +
                        (standardW - outputTxtW) / 2 +
                        outputTxtW / 2 + debugX;

                    const rotateCenterY = addrH + outputTxtW / 2;

                    context.save();
                    if (outputTxt === "ー") {
                        context = rotateCanvas(context, 87, rotateCenterX, rotateCenterY);
                    } else {
                        context = rotateCanvas(context, 90, rotateCenterX, rotateCenterY);
                    }

                    context.scale(1, -1); //左右反転
                    context.fillText(outputTxt, textX, -textY);
                    context.restore();
                    //context.fillText(outputTxt, textX, textY);

                    if (DEBUG_MODE) {
                        context.save();
                        context.fillStyle = "blue";
                        context.fillRect(textX, textY, 2, 2);
                        context.fillStyle = "red";
                        context.fillRect(rotateCenterX, rotateCenterY, 2, 2);
                        context.restore();
                    }

                    addrH += outputTxtW + lineSpacingY;
                } else {
                    const textX =
                        x -
                        (standardW + lineSpacingX) * (addrWL + 1) +
                        (standardW - outputTxtW) / 2;
                    const textY = addrH + outputTxtH / 2;
                    context.fillText(outputTxt, textX, textY);

                    if (DEBUG_MODE) {
                        context.save();
                        context.fillStyle = "green";
                        context.fillRect(textX, textY, 2, 2);
                        context.restore();
                    }
                    addrH += outputTxtH + lineSpacingY;
                }
            });
            addrH = y;
            addrWL += 1;
        });
    }
    writeVertical(addrArrayDaraw, addrFontFamily, addrFontSize, postcardW - 20, 280, 10, 10);
    //送信者住所を描画
    const inputFromAddr = jsonData["from"]["addr"];
    let fromAddrFontSize;
    let fromAddrH = 0;
    const fromAddrTextH = 500;
    let fromAddrNewLine = [0];
    const fromAddrFontSizeList = [33, 30, 27, 24, 21, 19, 16, 13, 10, 7, 4, 1];
    for (h = 0; h < fromAddrFontSizeList.length; h++) {
        for (i = 0; i < inputFromAddr.length; i++) {
            const textH = getHeight(inputFromAddr[i], addrFontFamily, fromAddrFontSizeList[h]);
            //console.log(textH);
            fromAddrH += textH;
            //console.log(fromAddrH)
            if (fromAddrH > fromAddrTextH) {
                fromAddrNewLine.push([i - 1]);
                //console.log(fromAddrNewLine);
                fromAddrH = textH;
            }
            //console.log(fromAddrNewLine);
        }
        if (fromAddrNewLine.length < 3) {
            fromAddrFontSize = fromAddrFontSizeList[h];
            break;
        } else {
            fromAddrH = 0;
            fromAddrNewLine = [0];
        }
    }

    //console.log(fromAddrFontSize)
    const fromAddrArray = inputFromAddr.split("");
    let fromAddrArrayDaraw = [];
    for (i = 0; i < fromAddrNewLine.length; i++) {
        fromAddrArrayDaraw.push(fromAddrArray.slice(fromAddrNewLine[i], fromAddrNewLine[i + 1]));
    }
    //console.log(fromAddrArrayDaraw);
    writeVertical(fromAddrArrayDaraw, addrFontFamily, fromAddrFontSize, 370, 650, 10, 4);

    const lastName = jsonData["to"]["lastName"]; // 苗字
    const firstNames = jsonData["to"]["firstNames"]; // 名前
    const honorificTitle = jsonData["to"]["honorificTitle"]; // 敬称
    //console.log(firstNames.length)
    let maxFirstName;
    let maxFirstNameNum = 0;
    let firstNameCount = 0;
    let maxFirstNameArray;

    for (i = 0; i < firstNames.length; i++) {
        if (firstNames[i]) firstNameCount++;

        if (firstNames[i].length > maxFirstNameNum) {
            maxFirstName = firstNames[i];
            maxFirstNameNum = firstNames[i].length;
        }
    }
    const allNameText = lastName + maxFirstName + honorificTitle;

    let nameTextW = 0;
    let nameTextH = 0;

    // 宛名のフォントサイズの決定
    const fontSizeArray = [
        85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 4, 3, 2, 1,
    ];
    const nameMaxWSize = 700;
    const nameMaxHSize = 700;
    let nameFontSize;
    for (i = 0; i < fontSizeArray.length; i++) {
        nameTextW = 0;
        nameTextH = 0;
        nameFontSize = fontSizeArray[i];
        //console.log(nameFontSize);
        for (j = 0; j < allNameText.length; j++) {
            nameTextW += getWidth(allNameText[j], addrFontFamily, nameFontSize) + 20;
            nameTextH += getHeight(allNameText[j], addrFontFamily, nameFontSize) + 10;
            //console.log(getHeight(allNameText[j], addrFontFamily, nameFontSize))
        }
        if (nameTextH < nameMaxHSize && nameTextW < nameMaxWSize) break;
    }

    let maxFirstNameH = 0;
    let nameTextBaseLine = [];
    if (maxFirstName) {
        maxFirstNameArray = maxFirstName.split("");
        for (i = 0; i < maxFirstNameArray.length; i++) {
            maxFirstNameH += getHeight(maxFirstNameArray[i], addrFontFamily, nameFontSize) + 20;
        }
        //console.log(firstNameCount)
        if (firstNameCount == 1) {
            nameTextBaseLine.push(
                postcardW / 2 +
                    50 -
                    getWidth(maxFirstNameArray[0], addrFontFamily, nameFontSize) / 2
            );
        } else if (firstNameCount == 2) {
            const paperCenterLineName = getWidth(
                maxFirstNameArray[0],
                addrFontFamily,
                nameFontSize
            );
            nameTextBaseLine.push(postcardW / 2 + 50 + paperCenterLineName / 2 + 10);
            nameTextBaseLine.push(postcardW / 2 + 50 - paperCenterLineName / 2 - 10);
        } else if (firstNameCount == 3) {
            const paperCenterLineName = getWidth(
                maxFirstNameArray[0],
                addrFontFamily,
                nameFontSize
            );
            nameTextBaseLine.push(
                postcardW / 2 + 50 - paperCenterLineName / 2 + paperCenterLineName + 20
            );
            nameTextBaseLine.push(postcardW / 2 + 50 - paperCenterLineName / 2);
            nameTextBaseLine.push(
                postcardW / 2 + 50 - paperCenterLineName / 2 - paperCenterLineName - 20
            );
        } else if (firstNameCount == 4) {
            const paperCenterLineName = getWidth(
                maxFirstNameArray[0],
                addrFontFamily,
                nameFontSize
            );
            nameTextBaseLine.push(
                postcardW / 2 + 50 + paperCenterLineName / 2 + 25 + paperCenterLineName
            );
            nameTextBaseLine.push(postcardW / 2 + 50 + paperCenterLineName / 2 + 10);
            nameTextBaseLine.push(postcardW / 2 + 50 - paperCenterLineName / 2 - 10);
            nameTextBaseLine.push(
                postcardW / 2 + 50 - paperCenterLineName / 2 - 25 - paperCenterLineName
            );
        }
    } else {
        if (lastName) {
            nameTextBaseLine.push(
                postcardW / 2 - getWidth(lastName[0], addrFontFamily, nameFontSize) / 2
            );
        } else if (honorificTitle) {
            nameTextBaseLine.push(
                postcardW / 2 - getWidth(honorificTitle[0], addrFontFamily, nameFontSize) / 2
            );
        }
    }

    //console.log(nameTextBaseLine);

    const lastNameArray = lastName.split("");
    let lastNameH = 0;
    for (i = 0; i < lastNameArray.length; i++) {
        context.font = `${nameFontSize}px ${addrFontFamily}`;
        context.fillText(lastNameArray[i], nameTextBaseLine[0], 350 + lastNameH);
        lastNameH += getHeight(lastNameArray[i], addrFontFamily, nameFontSize) + 20;
    }

    let nameSpace = (nameTextH - maxFirstNameH) / 2;

    for (i = 0; i < firstNameCount; i++) {
        const firstNameArray = firstNames[i].split("");
        firstNameH = 0;
        firstNameHArr = [];
        let nameBetweenSpace = 0;
        let nameTextY = 0;
        for (j = 0; j < firstNameArray.length; j++) {
            const thisTextH = getHeight(firstNameArray[j], addrFontFamily, nameFontSize);
            firstNameH += thisTextH;
            firstNameHArr.push(thisTextH);
        }
        if (firstNameHArr.length > 1) {
            nameBetweenSpace = (maxFirstNameH - firstNameH) / (firstNameHArr.length - 1);
        }
        //console.log(nameBetweenSpace)
        firstNameH = 0;
        for (j = 0; j < firstNameArray.length; j++) {
            nameTextY = 0;
            if (firstNameHArr.length == 1) {
                nameTextY =
                    350 +
                    lastNameH +
                    nameSpace -
                    5 +
                    maxFirstNameH / 2 -
                    getHeight(firstNameArray[j], addrFontFamily, nameFontSize) / 2;
            } else if (firstNameHArr.length == 2 && j == 1) {
                nameTextY =
                    350 +
                    lastNameH +
                    nameSpace -
                    5 +
                    maxFirstNameH -
                    getHeight(firstNameArray[j], addrFontFamily, nameFontSize);
            } else {
                nameTextY = 350 + lastNameH + firstNameH + nameSpace - 5;
            }

            context.font = `${nameFontSize}px ${addrFontFamily}`;
            context.fillText(firstNameArray[j], nameTextBaseLine[i], nameTextY);

            firstNameH +=
                getHeight(firstNameArray[j], addrFontFamily, nameFontSize) + nameBetweenSpace;
        }
    }

    const honorificTitleArray = honorificTitle.split("");
    let honorificTitleH = 0;
    for (i = 0; i < firstNameCount; i++) {
        honorificTitleH = 0;
        for (j = 0; j < honorificTitleArray.length; j++) {
            context.font = `${nameFontSize}px ${addrFontFamily}`;
            context.fillText(
                honorificTitleArray[j],
                nameTextBaseLine[i],
                350 + lastNameH + maxFirstNameH + honorificTitleH + nameSpace + nameSpace
            );
            honorificTitleH += getHeight(honorificTitleArray[j], addrFontFamily, nameFontSize) + 20;
        }
    }

    //送信者郵便番号
    const inputFromPostCode = jsonData["from"]["postCode"];
    writePostCode(inputFromPostCode, 62, 1280, 40, 40, 13);

    // 送信者 住所

    const inputFromLastName = jsonData["from"]["lastName"]; // 苗字
    const inputFromFirstNames = jsonData["from"]["firstNames"]; // 名前

    let fromMaxFirstName;
    let fromMaxFirstNameNum = 0;
    let fromFirstNameCount = 0;
    let fromMaxFirstNameArray;
    let fromFirstNamesValueArray = [];
    for (i = 0; i < inputFromFirstNames.length; i++) {
        fromFirstNamesValueArray.push(inputFromFirstNames[i]);
        if (inputFromFirstNames[i]) fromFirstNameCount++;

        if (inputFromFirstNames[i].length > fromMaxFirstNameNum) {
            fromMaxFirstName = inputFromFirstNames[i];
            fromMaxFirstNameNum = inputFromFirstNames[i].length;
        }
    }
    const fromAllNameText = inputFromLastName + fromMaxFirstName;

    let fromNameTextW = 0;
    let fromNameTextH = 0;

    // 送り主のフォントサイズの決定
    const fromFontSizeArray = [40, 35, 30, 25, 20, 15, 10, 5, 4, 3, 2, 1];
    const fromNameMaxWSize = 200;
    const fromNameMaxHSize = 870;
    let fromNameFontSize;
    for (i = 0; i < fromFontSizeArray.length; i++) {
        fromNameTextW = 0;
        fromNameTextH = 0;
        fromNameFontSize = fromFontSizeArray[i];
        //console.log(fromNameFontSize);
        for (j = 0; j < fromAllNameText.length; j++) {
            fromNameTextW += getWidth(fromAllNameText[j], addrFontFamily, fromNameFontSize) + 2;
            fromNameTextH += getHeight(fromAllNameText[j], addrFontFamily, fromNameFontSize) + 2;
        }
        if (fromNameTextH < fromNameMaxHSize && fromNameTextW < fromNameMaxWSize) break;
    }

    let fromMaxFirstNameH = 0;
    let fromNameTextBaseLine = [];
    if (fromMaxFirstName) {
        fromMaxFirstNameArray = fromMaxFirstName.split("");
        for (i = 0; i < fromMaxFirstNameArray.length; i++) {
            fromMaxFirstNameH +=
                getHeight(fromMaxFirstNameArray[i], addrFontFamily, fromNameFontSize) + 20;
        }
        //console.log(fromFirstNameCount)
        if (fromFirstNameCount == 1) {
            fromNameTextBaseLine.push(
                120 - getWidth(fromMaxFirstNameArray[0], addrFontFamily, fromNameFontSize) / 2
            );
        } else if (fromFirstNameCount == 2) {
            const paperCenterLineName = getWidth(
                fromMaxFirstNameArray[0],
                addrFontFamily,
                fromNameFontSize
            );
            fromNameTextBaseLine.push(120 + paperCenterLineName / 2 + 10);
            fromNameTextBaseLine.push(120 - paperCenterLineName / 2 - 10);
        } else if (fromFirstNameCount == 3) {
            const paperCenterLineName = getWidth(
                fromMaxFirstNameArray[0],
                addrFontFamily,
                fromNameFontSize
            );
            fromNameTextBaseLine.push(120 - paperCenterLineName / 2 + paperCenterLineName + 20);
            fromNameTextBaseLine.push(120 - paperCenterLineName / 2);
            fromNameTextBaseLine.push(120 - paperCenterLineName / 2 - paperCenterLineName - 20);
        } else if (fromFirstNameCount == 4) {
            const paperCenterLineName = getWidth(
                fromMaxFirstNameArray[0],
                addrFontFamily,
                fromNameFontSize
            );
            fromNameTextBaseLine.push(120 + paperCenterLineName / 2 + 25 + paperCenterLineName);
            fromNameTextBaseLine.push(120 + paperCenterLineName / 2 + 10);
            fromNameTextBaseLine.push(120 - paperCenterLineName / 2 - 10);
            fromNameTextBaseLine.push(120 - paperCenterLineName / 2 - 25 - paperCenterLineName);
        }
    } else {
        if (inputFromLastName) {
            fromNameTextBaseLine.push(
                150 - getWidth(inputFromLastName[0], addrFontFamily, fromNameFontSize) / 2
            );
        } else if (honorificTitle) {
            fromNameTextBaseLine.push(
                150 - getWidth(honorificTitle[0], addrFontFamily, fromNameFontSize) / 2
            );
        }
    }

    //console.log(fromNameTextBaseLine);

    const fromLastNameArray = inputFromLastName.split("");
    const fromNameY = 700;
    let fromLastNameH = 0;
    for (i = 0; i < fromLastNameArray.length; i++) {
        context.font = `${fromNameFontSize}px ${addrFontFamily}`;
        context.fillText(fromLastNameArray[i], fromNameTextBaseLine[0], fromNameY + fromLastNameH);
        fromLastNameH += getHeight(fromLastNameArray[i], addrFontFamily, fromNameFontSize) + 20;
    }

    let fromNameSpace = 10;

    for (i = 0; i < fromFirstNameCount; i++) {
        const firstNameArray = inputFromFirstNames[i].split("");
        firstNameH = 0;
        firstNameHArr = [];
        let nameBetweenSpace = 0;
        let fromNameTextY = 0;
        for (j = 0; j < firstNameArray.length; j++) {
            const thisTextH = getHeight(firstNameArray[j], addrFontFamily, fromNameFontSize);
            firstNameH += thisTextH;
            firstNameHArr.push(thisTextH);
        }
        if (firstNameHArr.length > 1) {
            nameBetweenSpace = (fromMaxFirstNameH - firstNameH) / (firstNameHArr.length - 1);
        }
        //console.log(nameBetweenSpace)
        firstNameH = 0;
        for (j = 0; j < firstNameArray.length; j++) {
            fromNameTextY = 0;
            if (firstNameHArr.length == 1) {
                fromNameTextY =
                    fromNameY +
                    fromLastNameH +
                    fromNameSpace -
                    5 +
                    fromMaxFirstNameH / 2 -
                    getHeight(firstNameArray[j], addrFontFamily, fromNameFontSize) / 2;
            } else if (firstNameHArr.length == 2 && j == 1) {
                fromNameTextY =
                    fromNameY +
                    fromLastNameH +
                    fromNameSpace -
                    5 +
                    fromMaxFirstNameH -
                    getHeight(firstNameArray[j], addrFontFamily, fromNameFontSize);
            } else {
                fromNameTextY = fromNameY + fromLastNameH + firstNameH + fromNameSpace - 5;
            }

            context.font = `${fromNameFontSize}px ${addrFontFamily}`;
            context.fillText(firstNameArray[j], fromNameTextBaseLine[i], fromNameTextY);

            firstNameH +=
                getHeight(firstNameArray[j], addrFontFamily, fromNameFontSize) + nameBetweenSpace;
        }
    }

    if (canvas) {
        png = canvas.toDataURL();
        return png;
    }
}