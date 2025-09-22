function swHtmlBox(title, htmlContent, width = "750px", height = "350px") {
  Swal.fire({
    title: title,
    html: `
      <div style="
        padding: 10px;
        max-height: ${height};
        overflow-y: auto;
        direction: ltr;
        text-align: right;
      ">
        ${htmlContent}
      </div>
    `,
    showConfirmButton: true,
    confirmButtonText: "بستن",
    background: "var(--bg-color)",
    color: "var(--text-color)",
    confirmButtonColor: "#ef5350",
    customClass: {
      popup: "custom-swal-popup",
    },
  });

  // بعد از رندر شدن، عرض رو اعمال کن
  if (width) {
    const popup = document.querySelector(".custom-swal-popup");
    if (popup) {
      popup.style.maxWidth = width;
      popup.style.width = "100%";
    }
  }
}

const settingsTemp = `
  <style>
    /* استایل‌های داخلی برای پاپ‌آپ تنظیمات */
    .settings-container {
      padding: 15px;
      direction: rtl;
      text-align: right;
      font-family: var(--font-family); /* استفاده از فونت برنامه */
      color: var(--text-color);
    }
    .settings-section {
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid var(--text-color);
      border-bottom-color: rgba(var(--text-color), 0.5); /* یه رنگ ملایم‌تر */
    }
    .settings-section:last-of-type {
      border-bottom: none;
    }
    .settings-section-title {
      font-size: x-large; /* یا large */
      margin-bottom: 15px;
      color: var(--text-color);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .settings-option {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      padding: 5px 0;
    }
    .settings-option label {
      cursor: pointer;
      flex-grow: 1; /* لیبل کش بیاد */
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .settings-option span {
      color: var(--text-color);
    }
    .settings-input {
      padding: 5px;
      border: 1px solid var(--text-color);
      border-color: rgba(var(--text-color), 0.5);
      border-radius: 5px;
      background-color: var(--bg-color);
      color: var(--text-color);
      flex-shrink: 0; /* جلوی کوچک شدن اینپوت رو بگیره */
    }
    .settings-input[type="checkbox"] {
      width: 20px;
      height: 20px;
      margin-left: 5px; /* فاصله از لیبل */
    }
    .settings-input[type="color"] {
      width: 4rem;
      height: 2.5rem;
      cursor: pointer;
    }
    .settings-input[type="number"] {
      width: 80px;
      text-align: center;
    }
    .settings-select {
      width: 120px; /* یا auto */
    }
    .settings-buttons {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
      gap: 10px; /* فاصله بین دکمه‌ها */
    }
    .settings-btn {
      padding: 8px 15px;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      flex-grow: 1; /* دکمه‌ها کش بیان */
    }
    .settings-btn-save {
      background-color: #4CAF50;
    }
    .settings-btn-reset {
      background-color: #f44336;
    }
    .settings-note {
      font-size: small;
      color: var(--text-color);
      opacity: 0.7;
      margin-top: 15px;
    }

    .checkbox {
      display: none;
    }

    .slider {
      width: 60px;
      height: 30px;
      background-color: lightgray;
      border-radius: 20px;
      overflow: hidden;
      display: flex;
      align-items: center;
      border: 4px solid transparent;
      transition: .3s;
      box-shadow: 0 0 10px 0 rgb(0, 0, 0, 0.25) inset;
      cursor: pointer;
    }

    .slider::before {
      content: '';
      display: block;
      width: 100%;
      height: 100%;
      background-color: #fff;
      transform: translateX(-30px);
      border-radius: 20px;
      transition: .3s;
      box-shadow: 0 0 10px 3px rgb(0, 0, 0, 0.25);
    }

    .checkbox:checked ~ .slider::before {
      transform: translateX(30px);
      box-shadow: 0 0 10px 3px rgb(0, 0, 0, 0.25);
    }

    .checkbox:checked ~ .slider {
      /* background-color: #2196F3; */
      background-color: var(--theme-color);
    }

    .checkbox:active ~ .slider::before {
      transform: translate(0);
    }

    /* برای آیکون‌ها */
    .settings-icon {
      font-size: large;
      margin-left: 5px;
    }
  </style>

  <div class="settings-container">
    <div class="settings-section">
      <h3 class="settings-section-title"><i class="bi bi-display settings-icon"></i>نمایش</h3>
      
      <div class="settings-option">
        <label for="themeColorPicker">
          <span>رنگ اصلی برنامه:</span>
          <input type="color" id="themeColorPicker" class="settings-input" value="#2266cc">
        </label>
      </div>

      <div class="settings-option">
        <label for="fontFamilySelect">
          <span>فونت برنامه:</span>
          <select id="fontFamilySelect" class="settings-input settings-select">
            <option value="Vazir">وزیر</option>
            <option value="Arial">آریال</option>
            <option value="Tahoma">تاهوما</option>
            <!-- می‌توانید فونت‌های بیشتری اضافه کنید -->
          </select>
        </label>
      </div>

      <div class="settings-option">
        <label for="fontSizeSelect">
          <span>اندازه فونت:</span>
          <select id="fontSizeSelect" class="settings-input settings-select">
            <option value="small">کوچک</option>
            <option value="medium">متوسط</option>
            <option value="large">بزرگ</option>
            <option value="x-large">خیلی بزرگ</option>
          </select>
        </label>
      </div>

    </div>

    <div class="settings-section">
      <h3 class="settings-section-title"><i class="bi bi-database-fill-gear settings-icon"></i>مدیریت داده‌ها</h3>
      <div class="settings-option">
        <label for="itemsPerPageInput">
          <span>تعداد آیتم‌ها در هر صفحه:</span>
          <input oninput="fixNumberInp(event)" type="number" id="itemsPerPageInput" min="1" max="100" class="settings-input">
        </label>
      </div>
    </div>
    
    <div class="settings-section">
      <h3 class="settings-section-title"><i class="bi bi-lock-fill settings-icon"></i>امنیت</h3>
      <div class="settings-option">
        <label class="switch">
          <span>ورود با رمزعبور:</span>
          <input type="checkbox" onchange="usePinCheck(event)" id="usePinInp" class="checkbox">
          <div class="slider"></div>
        </label>
        <div id="pinOptions">
            <button onclick="resetPassword()" id="resetPassBtn" class="btn" style="display: var(--resetPass); padding: 0.75rem 1.25rem; background-color: #2266cc">
              تغییر رمز عبور
            </button>
          </div>

      </div>
    </div>

    <div class="settings-buttons">
      <button style="font-size: medium !important;" id="saveSettingsBtn" class="settings-btn settings-btn-save">ذخیره تنظیمات</button>
      <button style="font-size: medium !important;" id="resetSettingsBtn" class="settings-btn settings-btn-reset">بازنشانی تنظیمات</button>
    </div>

    <p class="settings-note">
      تغییرات ممکن است نیاز به بارگذاری مجدد صفحه داشته باشد.
    </p>
  </div>
`;

// Alert
function swAlert(icon, title, text) {
  Swal.fire({
    icon,
    title,
    text,
    confirmButtonText: "باشه",
    background: "var(--bg-color)",
    color: "var(--text-color)",
    confirmButtonColor: "#ef5350",
  });
}

// Confirm
async function swConfirm(
  title,
  text = "",
  showCancel = true,
  confirmText = "بله",
  cancelText = "خیر"
) {
  const result = await Swal.fire({
    title,
    text,
    icon: "question",
    showCancelButton: showCancel,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    customClass: {
      popup: "my-popup",
      confirmButton: "my-confirm",
      cancelButton: "my-cancel",
      container: "my-container",
      actions: "my-actions",
    },
  });

  return result.isConfirmed;
}

// Prompt
async function swPrompt(
  title,
  placeholder = "",
  confirmText = "تأیید",
  cancelText = "لغو",
  type = "text",
  inpAttr = {}
) {
  const result = await Swal.fire({
    title,
    input: type,
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    inputAttributes: inpAttr,
    customClass: {
      popup: "my-popup",
      confirmButton: "my-confirm",
      cancelButton: "my-cancel",
      container: "my-container",
      actions: "my-actions",
    },
  });

  return result.isConfirmed ? result.value : null;
}
