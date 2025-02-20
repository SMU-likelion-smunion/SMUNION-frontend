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

/*일단 나중에 삭제할 부분*/
function getClubId() {
  fetch(API_SERVER_DOMAIN + `/api/v1/users/clubs/selected`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      console.log("data", data);

      if (data.isSuccess) {
        console.log("get memberClubId 완료");
        const currentClubId = data.result.memberClubId;
        localStorage.setItem("currentClubId", currentClubId);
        console.log(currentClubId);
      } else {
        throw new Error("memberClubId 가져오기 실패");
      }
    })
    .catch((error) => {
      console.error("Error", error);
    });
}

// 현재 활성 동아리 프로필 설정 함수
function setActiveClubProfile(memberClubId) {
  return fetch(API_SERVER_DOMAIN + `/api/v1/users/clubs/select?memberClubId=${memberClubId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.isSuccess) {
        console.log("동아리 프로필 설정 완료:", data.result);
        return data.result;
      } else {
        throw new Error("동아리 프로필 설정 실패: " + data.message);
      }
    });
}
/* ------------------*/


/* 쿠키 관련 함수들 */
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

function getClubId() {
  fetch(API_SERVER_DOMAIN + `/api/v1/users/clubs/selected`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      console.log("data", data);

      if (data.isSuccess) {
        console.log("get memberClubId 완료");
        const currentClubId = data.result.memberClubId;
        localStorage.setItem("currentClubId", currentClubId);
        console.log(currentClubId);
      } else {
        throw new Error("memberClubId 가져오기 실패");
      }
    })
    .catch((error) => {
      console.error("Error", error);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  let accessToken = getToken();
  
  // 동아리 프로필을 ID 1로 설정 <-- 임시로
  setActiveClubProfile(1)
    .then(() => {
      console.log("동아리 프로필 ID 1로 설정 성공");
      
      const storedClubId = localStorage.getItem("currentClubId");
      localStorage.setItem("storedClubId", storedClubId);
      localStorage.removeItem("storedclubId");
      getClubId();
      const currentClubId = localStorage.getItem("currentClubId");

      if (currentClubId !== storedClubId) {
        localStorage.setItem("selectedDepartments", JSON.stringify([]));
      }

      const selectedDepartments = JSON.parse(localStorage.getItem("selectedDepartments")) || [];

      // 저장된 공지 데이터 불러오기 (위젯 페이지에서 돌아온 경우)
      const loadSavedNoticeData = () => {
        // 제목과 설명 불러오기
        const savedTitle = localStorage.getItem("noticeTitle");
        const savedDesc = localStorage.getItem("noticeDescription");
        
        if (savedTitle) {
          document.querySelector(".input-title").value = savedTitle;
        }
        
        if (savedDesc) {
          document.querySelector(".input-explain").value = savedDesc;
        }
        
        // 저장된 위젯 타입에 따라 UI 업데이트
        const noticeData = localStorage.getItem("noticeData");
        if (noticeData) {
          const data = JSON.parse(noticeData);
          let widgetItem;
          
          // 위젯 타입에 따라 해당 아이템에 '저장됨' 표시
          switch (data.type) {
            case "basic":
              widgetItem = document.getElementById("wi1");
              break;
            case "attendance":
              widgetItem = document.getElementById("wi2");
              break;
            case "vote":
              widgetItem = document.getElementById("wi3");
              break;
            case "pay":
              widgetItem = document.getElementById("wi4");
              break;
          }
          
          if (widgetItem) {
            const innerDiv = widgetItem.querySelector("div");
            if (!innerDiv.querySelector(".saved-text")) {
              const savedText = document.createElement("p");
              savedText.textContent = "저장됨";
              savedText.classList.add("saved-text");
              innerDiv.appendChild(savedText);
            }
          }
        }
      };
      
      // 저장된 데이터 불러오기
      loadSavedNoticeData();

      //캘린더 헤더 날짜
      const calHeader = document.querySelector(".cal-top-header h1");
      const prevBtn = document.querySelector(".cal-top-header img:first-child");
      const nextBtn = document.querySelector(".cal-top-header img:last-child");
      const calDates = document.querySelector(".cal-dates");

      const prevScreen = document.querySelector(".cancel-btn");

      let currentDate = new Date(); //현재 화면의 날짜
      const today = new Date(); //오늘 날짜

      //이전 페이지에서 선택한 날짜 가져오기
      const savedDate = localStorage.getItem("selectedDate");
      let defaultDate;

      //저장된 값 or 없으면 오늘 날짜
      if (savedDate) {
        defaultDate = new Date(savedDate);
      } else {
        defaultDate = today;
      }

      function renderCalendar() {
        calDates.innerHTML = ""; //날짜 초기화
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const date = currentDate.getDate();

        calHeader.textContent = `${year}년 ${month + 1}월 ${today.getDate()}일`; //년 월 일

        const firstDay = new Date(year, month, 1).getDay(); //이번 달 첫째날 (요일 계산->시작위치 설정)
        const lastDay = new Date(year, month + 1, 0).getDate(); //이번 달 마지막 날짜 (일수 계산)
        const prevLastDate = new Date(year, month, 0).getDate(); //이전 달 마지막 날짜

        const savedYear = defaultDate.getFullYear();
        const savedMonth = defaultDate.getMonth();
        const savedDay = defaultDate.getDate();

        //지난 달 날짜
        for (let i = 0; i < firstDay; i++) {
          let prevBlankDiv = document.createElement("div");
          prevBlankDiv.classList.add("prev-month");
          let prevBlankSpan = document.createElement("span");
          prevBlankSpan.textContent = prevLastDate - (firstDay - 1) + i;
          prevBlankDiv.appendChild(prevBlankSpan);
          calDates.appendChild(prevBlankDiv);
        }

        //이번 달 날짜 생성
        for (let i = 1; i <= lastDay; i++) {
          let dateDiv = document.createElement("div");
          dateDiv.classList.add("dates");
          let spanElement = document.createElement("span");
          spanElement.textContent = i;

          //기본값으로 선택됨
          if (i === savedDay && year === savedYear && month === savedMonth) {
            dateDiv.classList.add("selected-date");
            calHeader.textContent = `${savedYear}년 ${savedMonth + 1}월 ${savedDay}일`;
          }

          dateDiv.appendChild(spanElement);
          calDates.appendChild(dateDiv);

          //날짜 클릭
          dateDiv.addEventListener("click", () => {
            document.querySelectorAll(".selected-date").forEach((item) => {
              item.classList.remove("selected-date");
            });
            dateDiv.classList.add("selected-date");

            //선택한 날짜 -> localStorage 저장
            const selectedDate = `${year}-${(month + 1).toString().padStart(2, "0")}-${i.toString().padStart(2, "0")}`;
            localStorage.setItem("selectedDate", selectedDate);

            calHeader.textContent = `${year}년 ${month + 1}월 ${i}일`;
          });
        }

        //다음 달 날짜
        const remainDays = 7 - ((firstDay + lastDay) % 7);
        if (remainDays < 7) {
          for (let i = 1; i <= remainDays; i++) {
            let nextBlankDiv = document.createElement("div");
            nextBlankDiv.classList.add("next-month");
            let nextBlankSpan = document.createElement("span");
            nextBlankSpan.textContent = i;
            nextBlankDiv.appendChild(nextBlankSpan);
            calDates.appendChild(nextBlankDiv);
          }
        }
      }

      //이전 달 클릭 > 이동
      prevBtn.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
      });

      //다음 달 클릭 > 이동
      nextBtn.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
      });

      renderCalendar();

      //-----------------------------------------------------------------------------------
      //참여형 위젯 설정

      const noticeItem = document.getElementById("wi1"); //일반 공지
      const attendItem = document.getElementById("wi2"); //출석 체크
      const voteItem = document.getElementById("wi3"); //의견 수집
      const payItem = document.getElementById("wi4"); //회비 납부

      //참여형 위젯 설정 > 일반 공지
      noticeItem.addEventListener("click", function () {
        const innerDiv = this.querySelector("div");
        const savedCheck = innerDiv.querySelector(".saved-text");

        if (savedCheck) {
          //'저장됨' 있는지 확인
          savedCheck.remove();
          // 일반 공지 선택 시 noticeData 삭제
          localStorage.removeItem("noticeData");
          localStorage.removeItem("voteData");
          localStorage.removeItem("payData");
          localStorage.removeItem("attendData");
        } else {
          savedText = document.createElement("p");
          savedText.textContent = "저장됨";
          savedText.classList.add("saved-text");
          innerDiv.appendChild(savedText);
          
          // 일반 공지 선택 및 다른 위젯 선택 해제
          document.querySelectorAll(".widget-items").forEach(item => {
            if (item.id !== "wi1" && item.querySelector(".saved-text")) {
              item.querySelector(".saved-text").remove();
            }
          });
          
          // 일반 공지 데이터 저장
          const noticeData = {
            type: "basic",
            title: document.querySelector('.input-title').value,
            description: document.querySelector('.input-explain').value,
            date: localStorage.getItem("selectedDate") || new Date().toISOString().split('T')[0],
            targetDepartments: JSON.parse(localStorage.getItem("selectedDepartments") || "[]")
          };
          localStorage.setItem("noticeData", JSON.stringify(noticeData));
        }
      });

      //참여형 위젯 설정 > 출석 체크
      attendItem.addEventListener("click", () => {
        // 다른 위젯 선택 표시 제거
        document.querySelectorAll(".widget-items").forEach(item => {
          const savedCheck = item.querySelector(".saved-text");
          if (savedCheck) savedCheck.remove();
        });
        
        // 공지 제목과 설명을 로컬 스토리지에 저장
        const title = document.querySelector('.input-title').value;
        const explanation = document.querySelector('.input-explain').value;
        const targetDepartments = JSON.parse(localStorage.getItem("selectedDepartments") || "[]");
        
        localStorage.setItem('noticeTitle', title);
        localStorage.setItem('noticeDescription', explanation);
        localStorage.setItem('targetDepartments', JSON.stringify(targetDepartments));
        
        // 위젯 페이지로 이동
        window.location.href = "../../html/pages/club-notice-create-attend.html";
      });

      //참여형 위젯 설정 > 의견 수집
      voteItem.addEventListener("click", () => {
        // 다른 위젯 선택 표시 제거
        document.querySelectorAll(".widget-items").forEach(item => {
          const savedCheck = item.querySelector(".saved-text");
          if (savedCheck) savedCheck.remove();
        });
        
        // 공지 제목과 설명을 로컬 스토리지에 저장
        const title = document.querySelector('.input-title').value;
        const explanation = document.querySelector('.input-explain').value;
        const targetDepartments = JSON.parse(localStorage.getItem("selectedDepartments") || "[]");
        
        localStorage.setItem('noticeTitle', title);
        localStorage.setItem('noticeDescription', explanation);
        localStorage.setItem('targetDepartments', JSON.stringify(targetDepartments));
        
        // 위젯 페이지로 이동
        window.location.href = "../../html/pages/club-notice-create-vote.html";
      });

      //참여형 위젯 설정 > 회비 납부
      payItem.addEventListener("click", () => {
        // 다른 위젯 선택 표시 제거
        document.querySelectorAll(".widget-items").forEach(item => {
          const savedCheck = item.querySelector(".saved-text");
          if (savedCheck) savedCheck.remove();
        });
        
        // 공지 제목과 설명을 로컬 스토리지에 저장
        const title = document.querySelector('.input-title').value;
        const explanation = document.querySelector('.input-explain').value;
        const targetDepartments = JSON.parse(localStorage.getItem("selectedDepartments") || "[]");
        
        localStorage.setItem('noticeTitle', title);
        localStorage.setItem('noticeDescription', explanation);
        localStorage.setItem('targetDepartments', JSON.stringify(targetDepartments));
        
        // 위젯 페이지로 이동
        window.location.href = "../../html/pages/club-notice-create-pay.html";
      });

      //'취소' 버튼 클릭 > 이전 화면
      prevScreen.addEventListener("click", () => {
        window.history.back();
      });

      // '완료' 버튼 클릭 > 공지 생성
      const completeBtn = document.querySelector(".complete-btn");
      completeBtn.addEventListener("click", async () => {
        // 필수 입력 검증
        const title = document.querySelector(".input-title").value.trim();
        const description = document.querySelector(".input-explain").value.trim();
        const selectedDate = localStorage.getItem("selectedDate");
        const targetDepartments = JSON.parse(localStorage.getItem("selectedDepartments") || "[]");
        
        if (!title) {
          alert("제목을 입력해주세요.");
          return;
        }
        
        if (!selectedDate) {
          alert("날짜를 선택해주세요.");
          return;
        }
        
        if (targetDepartments.length === 0) {
          alert("전달 대상을 선택해주세요.");
          return;
        }
        
        // noticeData 확인 (위젯 설정 여부)
        const noticeData = localStorage.getItem("noticeData");
        let noticeType = "basic"; // 기본값은 일반 공지
        
        if (noticeData) {
          const parsedData = JSON.parse(noticeData);
          noticeType = parsedData.type;
        }
        
        try {
          let response;
          
          switch (noticeType) {
            case "basic":
              // 일반 공지 API 호출
              response = await fetch(`${API_SERVER_DOMAIN}/api/v1/notices/basic`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${accessToken}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  title: title,
                  content: description,
                  targetDepartments: targetDepartments,
                  date: new Date(selectedDate).toISOString()
                })
              });
              break;
              
            case "vote":
              // 투표 공지 API 호출
              const voteData = JSON.parse(localStorage.getItem("voteData") || "{}");
              response = await fetch(`${API_SERVER_DOMAIN}/api/v1/notices/votes`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${accessToken}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  title: title,
                  description: description,
                  targetDepartments: targetDepartments,
                  date: new Date(selectedDate).toISOString(),
                  allowDuplicate: voteData.allowDuplicate || false,
                  anonymous: voteData.anonymous || false,
                  options: voteData.options || []
                })
              });
              break;
              
            case "attendance":
              // 출석 공지 API 호출
              const attendData = JSON.parse(localStorage.getItem("attendData") || "{}");
              response = await fetch(`${API_SERVER_DOMAIN}/api/v1/notices/attendance`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${accessToken}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  title: title,
                  content: description,
                  targetDepartments: targetDepartments,
                  date: attendData.time || new Date(selectedDate).toISOString()
                })
              });
              break;
              
            case "pay":
              // 회비 공지 API 호출
              const payData = JSON.parse(localStorage.getItem("payData") || "{}");
              response = await fetch(`${API_SERVER_DOMAIN}/api/v1/notices/fees`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${accessToken}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  title: title,
                  content: description,
                  amount: payData.amount || 0,
                  bank: payData.bankName || "",
                  accountNumber: payData.accountNumber || "",
                  deadLine: new Date(selectedDate).toISOString(),
                  participantCount: payData.isAutoMemberCount ? targetDepartments.length : (payData.participantCount || 1),
                  targetDepartments: targetDepartments
                })
              });
              break;
          }
          
          const result = await response.json();
          
          if (result.isSuccess) {
            // 성공적으로 공지 생성
            alert("공지가 성공적으로 생성되었습니다.");
            
            // 로컬 스토리지 데이터 정리
            localStorage.removeItem("noticeData");
            localStorage.removeItem("voteData");
            localStorage.removeItem("payData");
            localStorage.removeItem("attendData");
            localStorage.removeItem("noticeTitle");
            localStorage.removeItem("noticeDescription");
            
            // 공지 목록 페이지로 이동
            window.location.href = "../../html/pages/notice-all.html";
          } else {
            alert(`공지 생성 실패: ${result.message}`);
          }
        } catch (error) {
          console.error("공지 생성 중 오류 발생:", error);
          alert("공지 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
        }
      });

      //-----------------------------------------------------------------------------------
      //전달 대상
      const targetType = document.querySelector(".target-type");
      // const selectedDepartments = JSON.parse(localStorage.getItem("selectedDepartments")) || [];

      fetch(API_SERVER_DOMAIN + `/api/v1/department/getAll`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          console.log("target data", data);

          if (data.isSuccess) {
            const departments = data.result.departmentDTOS;

            departments.forEach((department) => {
              const targetItemDiv = document.createElement("div");
              targetItemDiv.classList.add("target-type-items");

              const departmentName = document.createElement("p");
              departmentName.textContent = department.name;
              targetItemDiv.appendChild(departmentName);

              const circleImg = document.createElement("img");

              //저장된 선택 상태 가져오기
              if (selectedDepartments.includes(department.name)) {
                circleImg.src = "/assets/icons/checked-target.svg";
                circleImg.dataset.checked = "true";
              } else {
                circleImg.src = "/assets/icons/empty-circle.svg";
                circleImg.dataset.checked = "false";
              }

              targetItemDiv.appendChild(circleImg);

              // circleImg.src = "/assets/icons/empty-circle.svg";
              // circleImg.dataset.checked = "false"; //체크 상태
              // targetItemDiv.appendChild(circleImg);

              //부서 클릭했을 때
              targetItemDiv.addEventListener("click", () => {
                let selectedDepartments = JSON.parse(localStorage.getItem("selectedDepartments")) || [];
                if (circleImg.dataset.checked === "false") {
                  circleImg.src = "/assets/icons/checked-target.svg";
                  circleImg.dataset.checked = "true";
                  selectedDepartments.push(department.name); //추가
                } else {
                  circleImg.src = "/assets/icons/empty-circle.svg";
                  circleImg.dataset.checked = "false";
                  const index = selectedDepartments.indexOf(department.name);
                  if (index > -1) selectedDepartments.splice(index, 1); //제거
                }

                localStorage.setItem("selectedDepartments", JSON.stringify(selectedDepartments));
              });

              targetType.appendChild(targetItemDiv);

              const itemHr = document.createElement("hr");
              targetType.appendChild(itemHr);
            });

            //'모두 선택' 클릭
            const selectAll = document.querySelector(".all-select");

            selectAll.addEventListener("click", () => {
              const allDepartments = document.querySelectorAll(".target-type-items img");
              const isAllSelected = [...allDepartments].every((img) => img.dataset.checked === "true");

              if (isAllSelected) {
                //해제
                allDepartments.forEach((img) => {
                  img.src = "/assets/icons/empty-circle.svg";
                  img.dataset.checked = "false";
                });
                localStorage.setItem("selectedDepartments", JSON.stringify([]));
              } else {
                //모두 선택
                const selectedNames = [];
                allDepartments.forEach((img) => {
                  img.src = "/assets/icons/checked-target.svg";
                  img.dataset.checked = "true";
                  selectedNames.push(img.parentNode.querySelector("p").textContent);
                });
                localStorage.setItem("selectedDepartments", JSON.stringify(selectedNames));
              }
            });
          } else {
            throw new Error("가입된 동아리 목록 조회 실패");
          }
        })
        .catch((error) => {
          console.error("Error", error);
        });
    })
    .catch(error => {
      console.error("동아리 프로필 설정 중 오류:", error);
    });
});