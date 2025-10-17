document.addEventListener('DOMContentLoaded', () => {

  // --- DOM Elements ---
  const authView = document.getElementById('auth-view');
  const dashboardView = document.getElementById('dashboard-view');

  const loginFormContainer = document.getElementById('login-form-container');
  const signupFormContainer = document.getElementById('signup-form-container');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  const showSignupLink = document.getElementById('show-signup');
  const showLoginLink = document.getElementById('show-login');
  const authError = document.getElementById('auth-error');

  const coursesView = document.getElementById('courses-view');
  const materialsView = document.getElementById('materials-view');
  const coursesList = document.getElementById('courses-list');
  const materialsList = document.getElementById('materials-list');
  const courseTitle = document.getElementById('course-title');
  const backToCoursesBtn = document.getElementById('back-to-courses-btn');
  const logoutBtn = document.getElementById('logout-btn');

  // Initialize lucide icons
  lucide.createIcons();

  // --- API Functions ---
  const api = {
    signup: async (email, password) => {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return await response.json();
    },
    signin: async (email, password) => {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return await response.json();
    },
    getCourses: async () => {
        const response = await fetch('/api/courses');
        return await response.json();
    },
    getMaterials: async (courseId) => {
        const response = await fetch(`/api/materials/${courseId}`);
        return await response.json();
    }
  };
  
  // --- UI Functions ---
  const showView = (viewToShow) => {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    viewToShow.classList.add('active');
  };

  const showError = (message) => {
    authError.textContent = message;
    authError.classList.remove('hidden');
  };
  
  const hideError = () => {
    authError.classList.add('hidden');
  };

  const renderCourses = (courses) => {
    coursesList.innerHTML = '';
    if (courses && courses.length > 0) {
      courses.forEach(course => {
        const li = document.createElement('li');
        li.textContent = course.name;
        li.dataset.courseId = course.id;
        li.addEventListener('click', () => showMaterialsForCourse(course));
        coursesList.appendChild(li);
      });
    } else {
      coursesList.innerHTML = '<p>لم يتم إضافة أي مواد دراسية بعد.</p>';
    }
  };

  const renderMaterials = (materials) => {
    materialsList.innerHTML = '';
    if (materials && materials.length > 0) {
      materials.forEach(material => {
        const li = document.createElement('li');
        const icon = material.type === 'lecture' ? 'file-text' : 
                     material.type === 'section' ? 'file-input' : 'video';
        li.innerHTML = `<i data-lucide="${icon}"></i> ${material.title}`;
        materialsList.appendChild(li);
      });
    } else {
      materialsList.innerHTML = '<p>لا يوجد محتوى لهذه المادة بعد.</p>';
    }
    lucide.createIcons();
  };
  
  const showMaterialsForCourse = async (course) => {
    courseTitle.textContent = course.name;
    const materials = await api.getMaterials(course.id);
    renderMaterials(materials);
    coursesView.classList.add('hidden');
    materialsView.classList.remove('hidden');
  };

  const initializeDashboard = async () => {
      showView(dashboardView);
      const courses = await api.getCourses();
      renderCourses(courses);
  };
  
  // --- Event Listeners ---
  showSignupLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginFormContainer.classList.add('hidden');
    signupFormContainer.classList.remove('hidden');
    hideError();
  });

  showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    signupFormContainer.classList.add('hidden');
    loginFormContainer.classList.remove('hidden');
    hideError();
  });
  
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const result = await api.signup(email, password);
    if (result.error) {
      showError(result.error);
    } else {
      alert('تم إنشاء حسابك بنجاح! يرجى تسجيل الدخول.');
      showLoginLink.click();
    }
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const result = await api.signin(email, password);

    if (result.error) {
      showError(result.error);
    } else if (result.session) {
      // For simplicity, we are not storing the session token.
      // In a real app, you would store result.session.access_token in localStorage.
      initializeDashboard();
    }
  });

  backToCoursesBtn.addEventListener('click', () => {
    materialsView.classList.add('hidden');
    coursesView.classList.remove('hidden');
  });

  logoutBtn.addEventListener('click', () => {
      // In a real app, you would clear the stored session token and call supabase.auth.signOut()
      showView(authView);
      // Reset dashboard
      materialsView.classList.add('hidden');
      coursesView.classList.remove('hidden');
  });

  // --- Initial Check ---
  // In a real app, you would check if a session token exists in localStorage
  // and try to authenticate the user automatically.
  // For now, we always start at the auth view.
  showView(authView);

});

