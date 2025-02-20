document.addEventListener("DOMContentLoaded", () => {

    const cancelBtn = document.getElementById("cancel-btn");
    const submitBtn = document.getElementById("submit-btn");
    const hourInput = document.getElementById("hour-input");
    const minuteInput = document.getElementById("minute-input");
    const amOption = document.getElementById("am-option");
    const pmOption = document.getElementById("pm-option");
  

    let isPM = false;
    

    const initFromLocalStorage = () => {
      const savedAttendData = localStorage.getItem("attendData");
      if (savedAttendData) {
        try {
          const attendData = JSON.parse(savedAttendData);
          

          if (attendData.time) {
            const timeDate = new Date(attendData.time);
            const hours = timeDate.getHours();
            const minutes = timeDate.getMinutes();
            
            // 시간 설정 (12시간제로 변환)
            isPM = hours >= 12;
            const display12Hour = hours % 12 || 12;
            
            hourInput.value = display12Hour;
            minuteInput.value = minutes.toString().padStart(2, '0');
            
            // AM/PM 설정
            if (isPM) {
              selectPM();
            } else {
              selectAM();
            }
          }
        } catch (e) {
          console.error("로컬 스토리지 데이터 파싱 오류:", e);
        }
      } else {
        // 기본값 설정
        hourInput.value = "00";
        minuteInput.value = "00";
        selectAM();
      }
    };
    
    // AM 
    const selectAM = () => {
      isPM = false;
      amOption.classList.add("selected");
      amOption.querySelector(".am-pm-circle").classList.add("selected");
      pmOption.classList.remove("selected");
      pmOption.querySelector(".am-pm-circle").classList.remove("selected");
    };
    
    // PM 
    const selectPM = () => {
      isPM = true;
      pmOption.classList.add("selected");
      pmOption.querySelector(".am-pm-circle").classList.add("selected");
      amOption.classList.remove("selected");
      amOption.querySelector(".am-pm-circle").classList.remove("selected");
    };
  
    const validateInputs = () => {
      // 시간 값
      let hour = parseInt(hourInput.value);
      if (isNaN(hour) || hour < 1 || hour > 12) {
        alert("시간은 1~12 사이의 값이어야 합니다.");
        hourInput.focus();
        return false;
      }
      
      // 분 값
      let minute = parseInt(minuteInput.value);
      if (isNaN(minute) || minute < 0 || minute > 59) {
        alert("분은 0~59 사이의 값이어야 합니다.");
        minuteInput.focus();
        return false;
      }
      
      return true;
    };
    
    // 시간 데이터 생성 및 저장
    const saveTimeData = () => {
      if (!validateInputs()) return false;
      
      // 입력 값 가져오기
      let hour = parseInt(hourInput.value);
      let minute = parseInt(minuteInput.value);
      
      // 24시간제로 변환
      if (isPM && hour !== 12) {
        hour += 12;
      } else if (!isPM && hour === 12) {
        hour = 0;
      }
      
      // 기존 날짜 정보에 시간 추가
      const selectedDate = localStorage.getItem("selectedDate");
      let dateTime;
      
      if (selectedDate) {
        // 상위 페이지에서 전달받은 날짜 사용
        const datePart = new Date(selectedDate).toISOString().split('T')[0];
        const timePart = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        dateTime = `${datePart}T${timePart}.000Z`;
      } else {
        // 날짜 정보가 없으면 현재 날짜 사용하고 시간만 설정
        const today = new Date();
        today.setHours(hour, minute, 0, 0);
        dateTime = today.toISOString();
      }
      
      // 로컬 스토리지에 저장
      const attendData = {
        time: dateTime
      };
      
      localStorage.setItem("attendData", JSON.stringify(attendData));
      
      // 공지 데이터 구성
      const noticeData = {
        type: "attendance",
        title: localStorage.getItem("noticeTitle") || "",
        description: localStorage.getItem("noticeDescription") || "",
        targetDepartments: localStorage.getItem("targetDepartments") 
          ? JSON.parse(localStorage.getItem("targetDepartments")) 
          : ["전체"],
        attendData: attendData,
        date: dateTime
      };
      
      localStorage.setItem("noticeData", JSON.stringify(noticeData));
      
      return true;
    };
  
    hourInput.addEventListener("input", (e) => {
      let value = e.target.value;
      
      // 숫자만 입력 가능
      value = value.replace(/[^\d]/g, '');
      
      // 최댓값 제한
      if (value && parseInt(value) > 12) {
        value = '12';
      }
      
      e.target.value = value;
    });
    
    minuteInput.addEventListener("input", (e) => {
      let value = e.target.value;
      
      // 숫자만 입력 가능
      value = value.replace(/[^\d]/g, '');
      
      // 최댓값 제한
      if (value && parseInt(value) > 59) {
        value = '59';
      }
      
      // 두 자리로 표시
      if (value.length === 1) {
        value = value.padStart(2, '0');
      }
      
      e.target.value = value;
    });
    
    // 출력 시 앞에 0 붙이기
    hourInput.addEventListener("blur", () => {
      if (hourInput.value) {
        const value = parseInt(hourInput.value);
        hourInput.value = value;
      }
    });
    
    minuteInput.addEventListener("blur", () => {
      if (minuteInput.value) {
        const value = parseInt(minuteInput.value);
        minuteInput.value = value.toString().padStart(2, '0');
      } else {
        minuteInput.value = "00";
      }
    });
    
    // AM/PM 선택
    amOption.addEventListener("click", selectAM);
    pmOption.addEventListener("click", selectPM);
    
    // 취소 버튼
    cancelBtn.addEventListener("click", () => {
      window.history.back();
    });
    
    // 저장 버튼
    submitBtn.addEventListener("click", () => {
      if (saveTimeData()) {
        alert("출석 시간이 저장되었습니다.");
        window.history.back();
      }
    });
  
    // 초기화 함수 호출
    initFromLocalStorage();
  });