// apis.js
const $ = document;
const $s = (elem) => {
  return $.querySelector(elem);
};

const token = null; // لایسنس دریافتی از https://mail.apteam.ir/lic را اینجا وارد کنید.
let serverUrl = lic(token);


/* ----------  دریافت لیست ---------- */
export async function getContacts(filters = {}) {
  let apiUrl = `${serverUrl}/api/contact/list?`;
  const queryParams = new URLSearchParams();

  if (filters.status) queryParams.append("status", filters.status);
  if (filters.isDeleted !== undefined)
    queryParams.append("isDeleted", filters.isDeleted);
  if (filters.isStarred !== undefined)
    queryParams.append("isStarred", filters.isStarred);
  if (filters.hasReplied !== undefined)
    queryParams.append("hasReplied", filters.hasReplied);
  if (filters.page) queryParams.append("page", filters.page);
  if (filters.limit) queryParams.append("limit", filters.limit);

  apiUrl += queryParams.toString();

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (response.ok) {
      $s(".loading").style.display = "none";
      return data;
    } else {
      $s(".loading").style.display = "none";
      throw swAlert("error", "خطا در دریافت لیست");
    }
  } catch (error) {
    $s(".loading").style.display = "none";
    throw swAlert("error", "خطا در برقراری ارتباط با سرور");
  }
}

// مثال فراخوانی:
// fetchContacts({ status: 'unread', hasReplied: true , isStarred: true, page: 2 });
// fetchContacts({ isDeleted: true }); // نمایش فقط پیام‌های حذف شده
// fetchContacts(); // نمایش همه پیام‌ها (بدون فیلتر deleted)

/* ---------- دریافت یک رکورد با id ------------- */
export async function getContactById(id) {
  const apiUrl = `${serverUrl}/api/contact/${id}`;
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (response.ok) {
      $s(".loading").style.display = "none";
      return data;
    } else {
      throw swAlert("error", "خطا در دریافت جزئیات");
    }
  } catch (error) {
    throw swAlert("error", "خطا در برقراری ارتباط با سرور");
  }
}
// مثال فراخوانی:
// fetchContactById(123);

/* ----------  تغییر وضعیت خوانده شده/ نشده ---------- */
export async function readStatus(ids, value) {
  const apiUrl = `${serverUrl}/api/contact/bulk-update-read`;
  try {
    const response = await fetch(apiUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, value }),
    });
    const data = await response.json();
    if (response.ok) {
      $s(".loading").style.display = "none";
      swAlert("success", "عملیات با موفقیت انجام شد");
      return data;
    } else {
      $s(".loading").style.display = "none";
      throw swAlert("error", "عملیات با خطا مواجه شد");
    }
  } catch (error) {
    $s(".loading").style.display = "none";
    throw swAlert("error", "خطا در برقراری ارتباط با سرور");
  }
}
// مثال فراخوانی:
// readStatus([1, 5, 10], 1); // علامت‌گذاری به عنوان خوانده شده
// readStatus([2, 7], 0);    // علامت‌گذاری به عنوان خوانده نشده

/* ----------- تغییر ضعیت پیام ستاره دار / بدون ستاره */
export async function starredStatus(ids, value) {
  const apiUrl = `${serverUrl}/api/contact/bulk-update-starred`;
  try {
    const response = await fetch(apiUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, value }),
    });
    const data = await response.json();
    if (response.ok) {
      $s(".loading").style.display = "none";
      swAlert("success", "عملیات با موفقیت انجام شد");
      return data;
    } else {
      $s(".loading").style.display = "none";
      throw swAlert("error", "عملیات با خطا مواجه شد");
    }
  } catch (error) {
    $s(".loading").style.display = "none";
    throw swAlert("error", "خطا در برقراری ارتباط با سرور");
  }
}
// مثال فراخوانی:
// starredStatus([1, 5, 10], 1); // ستاره‌دار کردن
// starredStatus([2, 7], 0);    // برداشتن ستاره

/* ----------- تغییر ضعیت پیام پاسخ داده شده / پاسخ داده نشده */
export async function repliedStatus(ids, value) {
  const apiUrl = `${serverUrl}/api/contact/bulk-update-replied`;
  try {
    const response = await fetch(apiUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, value }),
    });
    const data = await response.json();
    if (response.ok) {
      $s(".loading").style.display = "none";
      return data;
    } else {
      $s(".loading").style.display = "none";
      throw swAlert("error", "عملیات با خطا مواجه شد");
    }
  } catch (error) {
    $s(".loading").style.display = "none";
    throw swAlert("error", "خطا در برقراری ارتباط با سرور");
  }
}
// مثال فراخوانی:
// repliedStatus([1, 5, 10], 1); // ستاره‌دار کردن
// repliedStatus([2, 7], 0);    // برداشتن ستاره

/* -------------- حذف نرم ---------------- */
export async function setDelete(ids) {
  const apiUrl = `${serverUrl}/api/contact/bulk-delete`;
  try {
    const response = await fetch(apiUrl, {
      method: "PATCH", // یا DELETE اگر ترجیح می‌دهید
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    const data = await response.json();
    if (response.ok) {
      $s(".loading").style.display = "none";
      swAlert("success", "حذف با موفقیت انجام شد");
      return data;
    } else {
      $s(".loading").style.display = "none";
      throw swAlert("error", "خطا در حذف آیتم");
    }
  } catch (error) {
    $s(".loading").style.display = "none";
    throw swAlert("error", "خطا در برقراری ارتباط با سرور");
  }
}
// مثال فراخوانی:
// setDelete([2, 7]);

/* --------------- بازیابی حذف نرم --------------- */
export async function unsetDelete(ids) {
  const apiUrl = `${serverUrl}/api/contact/bulk-restore`;
  try {
    const response = await fetch(apiUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    const data = await response.json();
    if (response.ok) {
      $s(".loading").style.display = "none";
      swAlert("success", "بازیابی با موفقیت انجام شد");
      return data;
    } else {
      $s(".loading").style.display = "none";
      throw swAlert("error", "خطا در بازیابی حذف شده ها");
    }
  } catch (error) {
    $s(".loading").style.display = "none";
    throw swAlert("error", "خطا در برقراری ارتباط با سرور");
  }
}
// مثال فراخوانی:
// unsetDelete([2, 7]);

/* -------------- حذف سخت -------------- */
export async function hardDelete(ids) {
  try {
    const response = await fetch(
      `${serverUrl}/api/contact/bulk-delete-permanent`,
      {
        // یا آدرس کامل API شما
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      $s(".loading").style.display = "none";
      throw swAlert("error", "خطا در حذف آیتم");
    }

    const result = await response.json();
    $s(".loading").style.display = "none";
    swAlert("success", "حذف با موفقیت انجام گردید");
    return result;
  } catch (error) {
    $s(".loading").style.display = "none";
    swAlert("error", "خطا در برقراری ارتباط با سرور");
  }
}

// مثال استفاده:
// hardDelete([1 , 2 , 3]); // اینها رکوردهای فعال رو حذف می‌کنه

/* ----------  ارسال ایمیل ---------- */
export async function sendEmail(recipientEmail, emailSubject, emailText) {
  const apiUrl = `${serverUrl}/api/send-email`;
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "Authorization": "Bearer YOUR_AUTH_TOKEN" // اگر نیاز به احراز هویت دارید
      },
      body: JSON.stringify({
        to: recipientEmail,
        subject: emailSubject,
        text: emailText,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      $s(".loading").style.display = "none";
      swAlert("success", "ایمیل با موفقیت ارسال شد");
      return data;
    } else {
      $s(".loading").style.display = "none";
      throw swAlert("error", "خطا در ارسال ایمیل");
    }
  } catch (error) {
    $s(".loading").style.display = "none";
    throw swAlert("error", "ارسال ایمیل با خطا مواجه شد!");
  }
}
// مثال فراخوانی:
// sendEmail("test-recipient@example.com", "سلام از کلاینت", "این یک تست ایمیل است.");
