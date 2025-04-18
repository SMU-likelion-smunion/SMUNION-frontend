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

async function getClubDetail() {
  try {
    const response = await fetch(API_SERVER_DOMAIN + `/api/v1/club/detail`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    if (data.isSuccess) {
      return {
        clubInfo_img: data.result.thumbnailUrl,
        clubInfo_name: data.result.name,
        clubInfo_desc: data.result.description,
      };
    } else {
      throw new Error("Failed to fetch club details");
    }
  } catch (error) {
    console.error("Error fetching club details:", error);
    return null;
  }
}

//동아리 부원 수 계산
async function getClubMemberCount() {
  try {
    const response = await fetch(`${API_SERVER_DOMAIN}/api/v1/club`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data && data.result && data.result.memberClubResponseList) {
      const memberCount = data.result.memberClubResponseList.length;
      return memberCount;
    } else {
      console.warn("No member data found.");
      return 0;
    }
  } catch (error) {
    console.error("Error fetching member data:", error);
    return 0;
  }
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

document.addEventListener("DOMContentLoaded", async () => {
  getToken();
  //console.log("Access Token:", accessToken);

  const clubPic = document.querySelector(".clubPic");
  const clubName = document.querySelector(".clubName");
  const detail = document.querySelector(".detail");

  const clubDetails = await getClubDetail();

  if (clubDetails) {
    const { clubInfo_img, clubInfo_name, clubInfo_desc } = clubDetails;

    if (clubPic) clubPic.src = clubInfo_img;
    if (clubName) clubName.textContent = clubInfo_name || "Unknown Club Name";
    if (detail) detail.textContent = clubInfo_desc || "No description available.";
  } else {
    console.warn("Failed to load club details.");
  }

  const memberCount = await getClubMemberCount();
  const memberCountElement = document.querySelector(".clubMemberNum");
  if (memberCountElement) {
    memberCountElement.textContent = `총 ${memberCount}명`;
  } else {
    console.warn(".memberCount element not found.");
  }

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
                  // 멤버 ID를 데이터 속성에 저장
                  userBox.dataset.memberId = member.memberId;
                  userBox.innerHTML = `
                    <img style="display: none;" class="deleteBtn" src="../../assets/icons/deleteBtn.png">
                    <img src="${member.url}">
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

  // 부서 삭제 및 부원 탈퇴 이벤트 리스너
  document.querySelector(".hierarchy-main").addEventListener("click", async function(e) {
    // 부서의 삭제 버튼 클릭 시
    if (e.target.classList.contains("deleteBtn") && e.target.closest(".clubinnerDept")) {
      const clubDeptItem = e.target.closest(".club-dept-item");
      if (clubDeptItem) {
        const departmentId = clubDeptItem.id;
        
        // 모달
        const modalHTML = `
          <div class="modal-overlay">
            <div class="modal" style="padding: 5px;">
              <p>부서를 삭제하시겠습니까?\n</p>
              <div class='modalBtn' style="margin-top: 12px;"> 
                <button class="cancel-delete" style="font-weight: 500;">취소</button>
                <button class="confirm-delete" style="font-weight: 800;">삭제</button>
              </div>
            </div>
          </div>
        `;
        
        document.body.insertAdjacentHTML("beforeend", modalHTML);
        
        // 배경 블러
        const bodyElements = document.querySelectorAll(
          "body *:not(.modal):not(.modal-overlay):not(.modal *)"
        );
        bodyElements.forEach((element) => {
          element.style.filter = `blur(1px)`;
        });
        
        // 확인 버튼 클릭
        const modal = document.querySelector(".modal-overlay");
        modal.querySelector(".confirm-delete").onclick = async function() {
          try {
            const result = await deleteDepartment(departmentId);
            if (result.isSuccess) {
              clubDeptItem.remove();
              alert("부서가 삭제되었습니다.");
            } else {
              alert(`부서 삭제 실패: ${result.message}`);
            }
          } catch (error) {
            alert("부서 삭제 중 오류가 발생했습니다.");
          } finally {
            // 모달 제거,블러 해제
            modal.remove();
            bodyElements.forEach((element) => {
              element.style.filter = ``;
            });
          }
        };
        
        // 취소 버튼 클릭하면..
        modal.querySelector(".cancel-delete").onclick = function() {
          // 모달 제거, 블러 해제
          modal.remove();
          bodyElements.forEach((element) => {
            element.style.filter = ``;
          });
        };
      }
    }
    
    // 부원의 삭제 버튼 클릭 시: 해당 부원이 먼저 탈퇴 요청 해야 함!
    if (e.target.classList.contains("deleteBtn") && e.target.closest(".userBox")) {
      const userBox = e.target.closest(".userBox");
      if (userBox) {
        const memberId = userBox.dataset.memberId;
        if (!memberId) {
          alert("부원 정보를 찾을 수 없습니다.");
          return;
        }
        
        // 모달
        const modalHTML = `
          <div class="modal-overlay">
            <div class="modal" style="padding: 5px;">
              <p>해당 부원을 탈퇴시키겠습니까?</p>
              <div class='modalBtn' style="margin-top: 12px;"> 
                <button class="cancel-delete" style="font-weight: 500;">취소</button>
                <button class="confirm-delete" style="font-weight: 800;">탈퇴</button>
              </div>
            </div>
          </div>
        `;
        
        document.body.insertAdjacentHTML("beforeend", modalHTML);
        
        // 배경 블러
        const bodyElements = document.querySelectorAll(
          "body *:not(.modal):not(.modal-overlay):not(.modal *)"
        );
        bodyElements.forEach((element) => {
          element.style.filter = `blur(1px)`;
        });
        
        // 확인
        const modal = document.querySelector(".modal-overlay");
        modal.querySelector(".confirm-delete").onclick = async function() {
          try {
            const result = await withdrawMember(memberId);
            if (result.isSuccess) {
              userBox.remove();
              alert("부원이 탈퇴되었습니다.");
            } else { // 탈퇴 요ㅕ청 안 한 부원일 경우
              if (result.message.includes("탈퇴 요청을 하지 않았습니다")) {
                alert("해당 부원이 먼저 탈퇴 요청을 해야 탈퇴 처리가 가능합니다.");
              } else {
                alert(`부원 탈퇴 실패: ${result.message}`);
              }
            }
          } catch (error) {
            alert("부원 탈퇴 처리 중 오류가 발생했습니다.");
          } finally {
            modal.remove();
            bodyElements.forEach((element) => {
              element.style.filter = ``;
            });
          }
        };
        
        // 취소
        modal.querySelector(".cancel-delete").onclick = function() {
          modal.remove();
          bodyElements.forEach((element) => {
            element.style.filter = ``;
          });
        };
      }
    }
  });
});

//편집버튼 눌었을시 부서추가 버튼 보이게 + deleteBtn보이게
document.getElementById("reviseBtn").onclick = function () {
  const inviteBtn = document.querySelector(".invite");
  inviteBtn.style.display = "none";

  const reviseBtn = document.querySelector("#reviseBtn");
  reviseBtn.className = "completeBtn";
  reviseBtn.textContent = "완료";
  
  // 기존 이벤트 핸들러 제거
  reviseBtn.onclick = null;

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
  
  // 동아리 정보 수정을 위한 UI 표시
  // 동아리 이름 수정 가능하도록
const clubName = document.querySelector(".clubName");
const originalClubName = clubName.textContent;
const clubNameEdit = document.createElement("div");
clubNameEdit.classList.add("edit-container");
clubNameEdit.innerHTML = `
  <input type="text" id="club-name-input" value="${originalClubName}" class="edit-input">
  <i class="fa-solid fa-pen edit-icon"></i>
`;
clubName.innerHTML = "";
clubName.appendChild(clubNameEdit);

// 동아리 설명 수정 가능하도록
const detail = document.querySelector(".detail");
const originalDetail = detail.textContent;
const detailEdit = document.createElement("div");
detailEdit.classList.add("edit-container");
detailEdit.innerHTML = `
  <textarea id="club-detail-input" class="edit-input">${originalDetail}</textarea>
  <i class="fa-solid fa-pen edit-icon"></i>
`;
detail.innerHTML = "";
detail.appendChild(detailEdit);

// textarea 자동 높이 조정 함수 추가
const textarea = document.getElementById("club-detail-input");
if (textarea) {
  // 초기 높이 설정
  textarea.style.height = 'auto';
  textarea.style.height = (textarea.scrollHeight) + 'px';
  
  // 입력 시 높이 자동 조절
  textarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
  });
}
  
  // 이미지 선택 input 추가
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.id = "club-image-input";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);
  
  // 이미지 클릭 시 파일 선택 창 열기
  addBtn.addEventListener("click", function() {
    fileInput.click();
  });
  
  // 이미지 선택 시 미리보기 표시
  fileInput.addEventListener("change", function(e) {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = function(event) {
        clubPic.src = event.target.result;
        clubPic.style.opacity = "1";
        clubPic.style.filter = "blur(0)";
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  });

  // 완료 버튼에 새 이벤트 핸들러 설정
  reviseBtn.onclick = async function() {
    // 기존 UI 복원
    inviteBtn.style.display = "flex";
    reviseBtn.className = "";
    reviseBtn.id = "reviseBtn";
    reviseBtn.textContent = "편집";
    
    // 동아리 정보 수정
    const nameInput = document.getElementById("club-name-input");
    const detailInput = document.getElementById("club-detail-input");
    const imageInput = document.getElementById("club-image-input");
    
    // 새 부서 추가 처리
    const newDeptInput = document.querySelector("#dept-input");
    
    // 정보 수정 로직 실행
    if (nameInput && detailInput) {
      console.log("동아리 정보 수정 시작");
      const formData = new FormData();
      formData.append("name", nameInput.value);
      formData.append("description", detailInput.value);
      
      if (imageInput && imageInput.files && imageInput.files[0]) {
        console.log("이미지 파일 추가");
        formData.append("image", imageInput.files[0]);
      }
      
      try {
        console.log("API 호출");
        const result = await updateClub(formData);
        console.log("API 응답:", result);
        
        if (result.isSuccess) {
          alert("동아리 정보가 수정되었습니다.");
        } else {
          alert(`동아리 수정 실패: ${result.message}`);
        }
      } catch (error) {
        console.error("동아리 수정 오류:", error);
        alert("동아리 수정 중 오류가 발생했습니다.");
      }
    }
    
    // 부서 추가 처리
    if (newDeptInput && newDeptInput.value.trim()) {
      console.log("부서 추가 시작");
      const newDeptName = newDeptInput.value.trim();
      try {
        const response = await fetch(`${API_SERVER_DOMAIN}/api/v1/department/create`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newDeptName,
          }),
        });
        
        const data = await response.json();
        if (data.isSuccess) {
          alert("부서가 생성되었습니다.");
        } else {
          alert(`부서 생성 실패: ${data.message}`);
        }
      } catch (error) {
        console.error("부서 생성 오류:", error);
        alert("부서 생성에 실패했습니다.");
      }
    }
    
    // 페이지 새로고침
    location.reload();
    
    // 이벤트 핸들러 재설정
    document.getElementById("reviseBtn").onclick = arguments.callee.caller;
  };
};

document.getElementById("deptAdd").onclick = function () {
  // 새로운 부서 항목을 템플릿 리터럴로 작성
  var newDeptHTML = `
  <hr>
    <div class="clubDept">
     <div class="clubinnerDept">
        <img class="deleteBtn" src="../../assets/icons/deleteBtn.png">
          <input type="text" id="dept-input" placeholder="부서명을 입력해주세요" />
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

const backBtn = document.querySelector(".backBtn");
backBtn.addEventListener("click", () => {
  window.history.back();
});

const invite = document.querySelector(".invite");
invite.addEventListener("click", () => {
  window.location.href = "/html/pages/clubInvite.html";
});


// 부서 삭제
async function deleteDepartment(departmentId) {
  try {
    const response = await fetch(`${API_SERVER_DOMAIN}/api/v1/department/${departmentId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("부서 삭제 실패:", error);
    throw error;
  }
}

// 부원 탈퇴 시키기 (관리자가 임의대로)

async function withdrawMember(memberId) {
  try {
    const response = await fetch(`${API_SERVER_DOMAIN}/api/v1/club/withdrawal/${memberId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("부원 탈퇴 처리 실패:", error);
    throw error;
  }
}

// 동아리 수정
async function updateClub(formData) {
  try {
    const response = await fetch(`${API_SERVER_DOMAIN}/api/v1/club/modify`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: formData
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("동아리 수정 실패:", error);
    throw error;
  }
}
