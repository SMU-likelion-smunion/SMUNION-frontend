const API_SERVER_DOMAIN = "https://smunion.shop";
let accessToken = getCookie("accessToken");

function getToken() {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "accessToken") {
      return value;
    }
  }
  return null;
}

function setCookie(name, value, days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(name) {
  var nameEQ = name + "=";
  var cookies = document.cookie.split(";");
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i];
    while (cookie.charAt(0) === " ") {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length);
    }
  }
  return null;
}

function deleteCookie(name) {
  document.cookie = name + "=; Expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;";
}

//동아리 부서 전체 조회
function getClubDpt() {
  return fetch(`${API_SERVER_DOMAIN}/api/v1/department/getAll`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (response.status === 401) {
        console.warn("Access Token 만료됨. 새 토큰 요청 중...");
        return refreshAccessToken().then((newToken) => getMyClub(newToken));
      }
      if (!response.ok) throw new Error("User info request failed");
      return response.json();
    })
    .catch((error) => {
      console.error("API 요청 오류:", error);
    });
}

function getClubDetail(token) {
  return fetch(`${API_SERVER_DOMAIN}/api/v1/club/detail`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (response.status === 401) {
        console.warn("Access Token 만료됨. 새 토큰 요청 중...");
        return refreshAccessToken().then((newToken) => getMyClub(newToken));
      }
      if (!response.ok) throw new Error("User info request failed");
      return response.json();
    })
    .catch((error) => {
      console.error("API 요청 오류:", error);
    });
}

//부서 열고 닫을수 있게
function deptMemSee(imgElement) {
  var memberInfo = imgElement.parentElement.nextElementSibling;

  if (memberInfo && memberInfo.classList.contains("memberInfo")) {
    if (memberInfo.style.display === "none") {
      memberInfo.style.display = "flex";
      imgElement.src = "../../assets/icons/upperVector.png";
    } else {
      memberInfo.style.display = "none";
      imgElement.src = "../../assets/icons/down-sign.svg";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  getToken();
  //console.log("Access Token:", accessToken);

  const hierarchyMain = document.querySelector(".hierarchy-main");
  hierarchyMain.innerHTML = "";

  //동아리 부서 조회
  getClubDpt().then((data) => {
    if (data && data.result.departmentDTOS) {
      //console.log(data);
      data.result.departmentDTOS.forEach((dpt) => {
        const clubDptDiv = document.createElement("div");
        clubDptDiv.classList.add("club-dept-item");
        clubDptDiv.id = dpt.departmentId;
        clubDptDiv.setAttribute("data-dept-name", dpt.clubName);

        clubDptDiv.innerHTML = `<div class="clubDept">
            <div class="clubinnerDept">
              <img style="display: none" class="deleteBtn" src="../../assets/icons/deleteBtn.png" />
              <p>${dpt.name}</p>
            </div>
            <img class="vector" src="../../assets/icons/down-sign.svg" onclick="deptMemSee(this);" />
          </div>
          <div class="memberInfo" style="display: none; flex-direction: column">
            </div>`;

        hierarchyMain.appendChild(clubDptDiv);
      });

      //동아리 부원 조회
      fetch(`${API_SERVER_DOMAIN}/api/v1/club`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          //console.log(data);

          if (data && data.result && data.result.memberClubResponseList) {
            const members = data.result.memberClubResponseList;
            //console.log(members);

            members.forEach((member) => {
              const departmentName = member.department.trim();
              //console.log(departmentName);

              const matchingDeptDiv = Array.from(document.querySelectorAll(".club-dept-item")).find(
                (dept) => {
                  const deptNameElement = dept.querySelector(".clubinnerDept > p");
                  const deptNameText = deptNameElement?.textContent.trim();
                  return deptNameText === departmentName;
                }
              );

              if (matchingDeptDiv) {
                const memberInfoDiv = matchingDeptDiv.querySelector(".memberInfo");
                if (memberInfoDiv) {
                  const userBox = document.createElement("div");
                  userBox.classList.add("userBox");
                  userBox.innerHTML = `
                    <img style="display: none;" class="deleteBtn" src="../../assets/icons/deleteBtn.png">
                    <img src="${member.url || "../../assets/images/default.png"}">
                    <p>${member.nickname || "Unknown"}</p>
                  `;
                  memberInfoDiv.appendChild(userBox);

                  const hr = document.createElement("hr");
                  hr.classList.add("bottom");
                  hr.style.marginLeft = "10px";
                } else {
                  console.warn(`.memberInfo not found ${departmentName}`);
                }
              } else {
                console.warn(`No matching department ${departmentName}`);
              }
            });
          }
        })
        .catch((error) => {
          console.error("Error fetching member data:", error);
        });
    }
  });
});

//편집버튼 눌었을시 부서추가 버튼 보이게 + deleteBtn보이게
document.getElementById("reviseBtn").onclick = function () {
  var deleteBtns = document.querySelectorAll(".deleteBtn");
  deleteBtns.forEach(function (btn) {
    btn.style.display = "inline"; // deleteBtn 보이게
  });
  var deptAdd = document.getElementById("deptAdd");
  deptAdd.style.display = "block";
  var addBtn = document.querySelector(".addBtn");
  addBtn.style.display = "inline";
  var clubPic = document.querySelector(".clubPic");
  clubPic.style.opacity = "0.8";
  clubPic.style.filter = "blur(3px)";
  var vectorBtns = document.querySelectorAll(".vector");
  vectorBtns.forEach(function (btn) {
    var srcValue = btn.src;
    var parts = srcValue.split("/");
    parts[parts.length - 1] = "starBtn.png";
    var newSrc = parts.join("/");
    btn.src = newSrc;
  });
};

// 부서 추가 기능 및 삭제 기능
document.getElementById("deptAdd").onclick = function () {
  // 새로운 부서 항목을 템플릿 리터럴로 작성
  var newDeptHTML = `
  <hr>
    <div class="clubDept">
     <div class="clubinnerDept">
        <img style="width: 15px; height: 15px;" class="deleteBtn" src="../../assets/icons/deleteBtn.png">
          <p>부서명을 입력해주세요</p>
      </div>
      <img class="starBtn" src="../../assets/icons/starBtn.png">
          </div>
          `;
  document.querySelector(".NewDept").innerHTML += newDeptHTML; //추가
};

// 이벤트 위임: .NewDept에 이벤트 리스너 추가
document.querySelector(".NewDept").addEventListener("click", function (e) {
  // 삭제 버튼 클릭 시
  if (e.target.classList.contains("deleteBtn")) {
    const clubDept = e.target.closest(".clubDept");
    if (clubDept) {
      const hrElement = clubDept.previousElementSibling;
      if (hrElement && hrElement.tagName === "HR") {
        hrElement.remove();
      }
      clubDept.remove();
    }
  }
  // 스타 버튼 클릭 시
  if (e.target.classList.contains("starBtn")) {
    const starImg = e.target;
    if (starImg.src.includes("starBtn.png")) {
      starImg.src = "../../assets/icons/checked_starBtn.png";
    } else {
      starImg.src = "../../assets/icons/starBtn.png";
    }
  }
});

const deleteButtons = document.querySelectorAll(".deleteBtn");
deleteButtons.forEach((button) => {
  button.onclick = function () {
    // 상위 div 요소 가져오기
    const parentDiv = this.closest("div");
    const modalHTML = `
      <div class="modal-overlay">
        <div class="modal">
          <p>탈퇴시키겠습니까?</p>
          <p>(탈퇴사유: 퇴학)</p>
          <div class='modalBtn'> 
          <button class="cancel-delete">취소</button>
          <button class="confirm-delete">탈퇴</button></div>
          </div>
        </div>
      </div>
    `;
    // body에 모달삽입
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    const bodyElements = document.querySelectorAll(
      "body *:not(.modal):not(.modal-overlay):not(.modal *)"
    );
    bodyElements.forEach((element) => {
      element.style.filter = `blur(1px) `;
    });

    //확인버튼클릭
    const modal = document.querySelector(".modal-overlay");
    modal.querySelector(".confirm-delete").onclick = function () {
      const hrElement = parentDiv.previousElementSibling;
      if (hrElement && hrElement.tagName === "HR") {
        hrElement.remove(); // <hr> 삭제
      }
      parentDiv.remove(); // 상위 div 삭제
      modal.remove(); // 모달 제거
      //화면 흐림 멈춤
      bodyElements.forEach((element) => {
        element.style.filter = ``;
      });
    };
    // 취소버튼클릭
    modal.querySelector(".cancel-delete").onclick = function () {
      modal.remove(); // 모달 제거
      // 화면흐림 멈춤
      bodyElements.forEach((element) => {
        element.style.filter = ``;
      });
    };
  };
});
