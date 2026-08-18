/**
 * CareerLens — Main Application Logic & Micro-Interactions
 */

// Global Chart References to allow redraws
window.radarChartInstance = null;
window.donutChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {

    /* =============================================
       0.0 THEME SYSTEM INITIALIZATION
       ============================================= */
    initTheme();

    /* =============================================
       0. MOBILE SIDEBAR TOGGLE
       ============================================= */
    const sidebarMobileToggle = document.getElementById('sidebar-mobile-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarTabLinks = document.querySelectorAll('.sidebar-link-lens');

    if (sidebarMobileToggle && sidebar) {
        // Toggle sidebar on mobile/tablet
        sidebarMobileToggle.addEventListener('click', () => {
            if (window.innerWidth >= 768 && window.innerWidth < 1024) {
                sidebar.classList.toggle('collapsed');
                // Trigger chart resize after collapse animation finishes
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 300);
            } else {
                sidebar.classList.toggle('show');
                sidebarMobileToggle.setAttribute('aria-expanded', 
                    sidebar.classList.contains('show') ? 'true' : 'false');
            }
        });

        // Close sidebar when a tab link is clicked (on mobile)
        sidebarTabLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 768) {
                    sidebar.classList.remove('show');
                    sidebarMobileToggle.setAttribute('aria-expanded', 'false');
                }
            });
        });

        // Close sidebar when clicking outside of it
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 768 && sidebar.classList.contains('show')) {
                if (!sidebar.contains(e.target) && !sidebarMobileToggle.contains(e.target)) {
                    sidebar.classList.remove('show');
                    sidebarMobileToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });

        // Close sidebar on window resize to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 1024) {
                sidebar.classList.remove('show');
                sidebar.classList.remove('collapsed');
                sidebarMobileToggle.setAttribute('aria-expanded', 'false');
            } else if (window.innerWidth >= 768 && window.innerWidth < 1024) {
                sidebar.classList.remove('show');
            }
        });
    }

    /* =============================================
       0.1 SCROLL REVEAL INITIALIZATION
       ============================================= */
    initScrollReveal();

    /* =============================================
       1. ROUTING & TAB SWITCHING
       ============================================= */
    const tabViews = document.querySelectorAll('.tab-view-lens');
    const tabLinks = document.querySelectorAll('.sidebar-link-lens, .cl-bottom-nav-item');

    if (tabLinks.length > 0) {
        tabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetTab = link.getAttribute('data-tab');
                if (!targetTab) return; // Allow normal navigation for "/"

                e.preventDefault();

                // Set active link style across all matching buttons
                tabLinks.forEach(l => {
                    if (l.getAttribute('data-tab') === targetTab) {
                        l.classList.add('active');
                    } else {
                        l.classList.remove('active');
                    }
                });

                // Toggle views
                tabViews.forEach(view => {
                    if (view.id === `${targetTab}-tab-view`) {
                        view.classList.add('active');
                    } else {
                        view.classList.remove('active');
                    }
                });

                // Smooth scroll to top of main view
                window.scrollTo({ top: 0, behavior: 'smooth' });

                // Trigger chart resize if charts are present
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 100);
            });
        });
    }

    /* =============================================
       2. SLIDING UPLOAD DRAWER (LANDING PAGE)
       ============================================= */
    const triggerUploadBtn = document.getElementById('analyze-trigger-btn');
    const uploadDrawer = document.getElementById('upload-drawer');

    if (triggerUploadBtn && uploadDrawer) {
        triggerUploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            uploadDrawer.style.display = 'block';
            triggerUploadBtn.setAttribute('aria-expanded', 'true');
            setTimeout(() => uploadDrawer.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
        });
    }

    /* =============================================
       3. DRAG & DROP FILE UPLOAD
       ============================================= */
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const fileNameBadge = document.getElementById('file-name-badge');
    const fileDisplayName = document.getElementById('file-display-name');
    
    // AJAX Progress Bar elements
    const uploadProgressContainer = document.getElementById('upload-progress-container');
    const uploadProgressBar = document.getElementById('upload-progress-bar');
    const uploadPercentage = document.getElementById('upload-percentage');
    const uploadSize = document.getElementById('upload-size');
    const cancelUploadBtn = document.getElementById('cancel-upload-btn');
    const changeFileBtn = document.getElementById('change-file-btn');
    const submitBtn = document.getElementById('submit-btn');
    const tempFilenameInput = document.getElementById('temp-filename');

    let uploadXHR = null;

    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                displaySelectedFile();
            }
        });

        fileInput.addEventListener('change', displaySelectedFile);
    }

    function displaySelectedFile() {
        if (fileInput && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            
            // Client-side file size validation (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                showFormatError('File size exceeds limit', 'Please upload a resume under 5MB (PDF only)');
                resetUploadUI();
                return;
            }

            // Client-side extension validation (PDF only)
            if (!file.name.toLowerCase().endsWith('.pdf')) {
                showFormatError('Format not supported', 'Please upload a valid resume format (PDF, DOCX)');
                resetUploadUI();
                return;
            }

            // Trigger the AJAX file upload
            uploadFileToServer(file);
        } else {
            resetUploadUI();
        }
    }

    function uploadFileToServer(file) {
        // Abort any active upload
        if (uploadXHR) {
            uploadXHR.abort();
        }

        // Show progress UI and reset states
        fileNameBadge.style.display = 'none';
        uploadProgressContainer.style.display = 'block';
        uploadProgressBar.style.width = '0%';
        uploadProgressBar.setAttribute('aria-valuenow', 0);
        uploadPercentage.textContent = '0%';
        uploadSize.textContent = `0.00 MB / ${(file.size / (1024 * 1024)).toFixed(2)} MB`;

        // Disable submit button during upload
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Uploading Resume...';
        }

        const formData = new FormData();
        formData.append('resume', file);

        uploadXHR = new XMLHttpRequest();
        uploadXHR.open('POST', '/upload_temp_resume', true);

        // Track progress
        uploadXHR.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                uploadProgressBar.style.width = `${percent}%`;
                uploadProgressBar.setAttribute('aria-valuenow', percent);
                uploadPercentage.textContent = `${percent}%`;
                uploadSize.textContent = `${(e.loaded / (1024 * 1024)).toFixed(2)} MB / ${(e.total / (1024 * 1024)).toFixed(2)} MB`;
            }
        };

        // Finish load
        uploadXHR.onload = () => {
            if (uploadXHR.status === 200) {
                try {
                    const response = JSON.parse(uploadXHR.responseText);
                    if (response.success) {
                        tempFilenameInput.value = response.filename;
                        fileDisplayName.textContent = `${response.original_filename} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
                        
                        // Show success state
                        uploadProgressContainer.style.display = 'none';
                        fileNameBadge.style.display = 'flex';

                        // Enable analysis button
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.textContent = 'Analyze Resume Match';
                        }
                    } else {
                        alert(`Upload failed: ${response.error || 'Unknown error'}`);
                        resetUploadUI();
                    }
                } catch (err) {
                    alert('Invalid server response during upload.');
                    resetUploadUI();
                }
            } else {
                let errorMsg = 'Upload failed.';
                try {
                    const response = JSON.parse(uploadXHR.responseText);
                    errorMsg = response.error || errorMsg;
                } catch(e) {}
                alert(errorMsg);
                resetUploadUI();
            }
            uploadXHR = null;
        };

        uploadXHR.onerror = () => {
            alert('An error occurred during file upload.');
            resetUploadUI();
            uploadXHR = null;
        };

        uploadXHR.send(formData);
    }

    function resetUploadUI() {
        if (uploadXHR) {
            uploadXHR.abort();
            uploadXHR = null;
        }
        if (fileInput) fileInput.value = '';
        if (tempFilenameInput) tempFilenameInput.value = '';
        if (fileNameBadge) fileNameBadge.style.display = 'none';
        if (uploadProgressContainer) uploadProgressContainer.style.display = 'none';
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Analyze Resume Match →';
        }
    }

    if (cancelUploadBtn) {
        cancelUploadBtn.addEventListener('click', resetUploadUI);
    }

    if (changeFileBtn) {
        changeFileBtn.addEventListener('click', resetUploadUI);
    }

    /* =============================================
       4. DYNAMIC LOADER SCREEN (IMAGE 4)
       ============================================= */
    const form = document.getElementById('analyzer-form');
    const loadingOverlay = document.getElementById('loading-overlay');
    const cancelAnalysisBtn = document.getElementById('cancel-analysis');

    if (form && loadingOverlay) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const tempVal = tempFilenameInput ? tempFilenameInput.value.trim() : '';
            if (!tempVal && (!fileInput || !fileInput.files || fileInput.files.length === 0)) {
                scrollToUploadSection();
                alert('Please upload or drag your resume PDF file first.');
                return;
            }

            const jdField = document.getElementById('job-description');
            const jdVal = jdField ? jdField.value.trim() : '';
            if (jdVal.length < 20) {
                if (jdField) {
                    jdField.focus();
                    jdField.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.4)';
                    setTimeout(() => { jdField.style.boxShadow = 'none'; }, 2000);
                }
                alert('Please enter a target job description (at least 20 characters) or click one of the sample role pills.');
                return;
            }

            // Clear direct file input value if temp file is saved to prevent duplicate upload overhead
            if (tempVal && fileInput) {
                fileInput.value = '';
            }

            // Play the 3-second scanning animation completely, then submit form
            runProgressAnimation(() => {
                form.submit();
            });
        });
    }

    if (cancelAnalysisBtn && loadingOverlay) {
        cancelAnalysisBtn.addEventListener('click', () => {
            loadingOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
            window.location.reload();
        });
    }

    /* =============================================
       5. INITIALIZE DASHBOARD WITH SERVER DATA
       ============================================= */
    const initialDataEl = document.getElementById('cl-initial-data');
    if (initialDataEl) {
        try {
            const parsedData = JSON.parse(initialDataEl.textContent);
            if (parsedData && parsedData.success) {
                renderDashboardState(parsedData);
            }
        } catch (err) {
            console.error("Failed to parse initial dashboard payload:", err);
        }
    } else if (window.CL_INITIAL_DATA && window.CL_INITIAL_DATA.success) {
        renderDashboardState(window.CL_INITIAL_DATA);
    }

    // Render history records log
    renderHistoryTab();

});

/* =============================================
   6. DYNAMIC PROGRESS BAR LOADER CORE (WAVE & DONUT)
   ============================================= */
function runProgressAnimation(onComplete = null) {
    const loadingOverlay = document.getElementById('loading-overlay');
    const scanTubeFill = document.getElementById('scan-tube-fill');
    const scanPctText = document.getElementById('scan-pct-text');
    const scanStageName = document.getElementById('scan-stage-name');
    const scanCircleProgress = document.getElementById('scan-circle-progress');
    const scanCirclePctLabel = document.getElementById('scan-circle-pct-label');
    
    if (!loadingOverlay) return;

    loadingOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Default to Wave Scanner view
    const waveView = document.getElementById('scan-view-wave');
    const modalView = document.getElementById('scan-view-modal');
    if (waveView && modalView) {
        waveView.style.display = 'flex';
        modalView.style.display = 'none';
    }

    // Toggle button handlers
    const togglePipelineBtn = document.getElementById('toggle-pipeline-details-btn');
    const toggleWaveBtn = document.getElementById('toggle-wave-view-btn');
    if (togglePipelineBtn) {
        togglePipelineBtn.onclick = () => {
            if (waveView) waveView.style.display = 'none';
            if (modalView) modalView.style.display = 'block';
        };
    }
    if (toggleWaveBtn) {
        toggleWaveBtn.onclick = () => {
            if (modalView) modalView.style.display = 'none';
            if (waveView) waveView.style.display = 'flex';
        };
    }

    let progress = 0;
    const donutCircumference = 364.42; // 2 * Math.PI * 58
    
    const steps = [
        { limit: 20, elementId: 'step-extract', name: 'EXTRACTING RESUME DATA' },
        { limit: 40, elementId: 'step-ocr', name: 'RUNNING OCR & TEXT RECOGNITION' },
        { limit: 65, elementId: 'step-skills', name: 'MATCHING SKILLS TO STANDARDS' },
        { limit: 85, elementId: 'step-ats', name: 'CALCULATING ATS SCORE' },
        { limit: 100, elementId: 'step-report', name: 'GENERATING RECOMMENDATIONS' }
    ];

    let currentStepIdx = 0;

    const interval = setInterval(() => {
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                if (onComplete) {
                    onComplete();
                }
            }, 120);
            return;
        }

        progress += 1;
        
        // Update Wave Tube
        if (scanTubeFill) {
            scanTubeFill.style.width = `${progress}%`;
        }
        if (scanPctText) {
            scanPctText.textContent = `${progress}%`;
        }

        // Update Donut Ring
        if (scanCirclePctLabel) {
            scanCirclePctLabel.textContent = `${progress}%`;
        }
        if (scanCircleProgress) {
            const offset = donutCircumference - (progress / 100) * donutCircumference;
            scanCircleProgress.style.strokeDashoffset = offset;
        }

        // Update Steps
        const currentStep = steps[currentStepIdx];
        if (currentStep && progress >= currentStep.limit) {
            const stepItem = document.getElementById(currentStep.elementId);
            if (stepItem) {
                stepItem.classList.remove('active-step', 'pending');
                stepItem.classList.add('completed');
            }

            currentStepIdx += 1;
            const nextStep = steps[currentStepIdx];
            if (nextStep) {
                if (scanStageName) scanStageName.textContent = nextStep.name;
                const nextItem = document.getElementById(nextStep.elementId);
                if (nextItem) {
                    nextItem.classList.remove('pending');
                    nextItem.classList.add('active-step');
                }
            }
        }
    }, 30); // Exactly 3.0 seconds animation (100 * 30ms = 3000ms)
}

/**
 * Displays the custom glowing red format error screen.
 */
function showFormatError(title = 'Format not supported', message = 'Please upload a valid resume format (PDF, DOCX)') {
    const overlay = document.getElementById('format-error-overlay');
    const titleEl = document.getElementById('error-overlay-title');
    const msgEl = document.getElementById('error-overlay-message');
    const closeBtn = document.getElementById('close-error-overlay-btn');

    if (!overlay) {
        alert(`${title}: ${message}`);
        return;
    }

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;

    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    if (closeBtn) {
        closeBtn.onclick = () => {
            overlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        };
    }
}

/* =============================================
   7. TRY DEMO SCAN FUNCTION
   ============================================= */
function runDemoScan() {
    const form = document.getElementById('analyzer-form');
    const fileInput = document.getElementById('file-input');
    const jdField = document.getElementById('job-description');
    const tempFilenameInput = document.getElementById('temp-filename');

    if (!form) return;

    // Pre-fill demo job description if empty
    if (!jdField.value || jdField.value.trim().length < 20) {
        useSample('frontend');
    }

    // Bypass required file validation dynamically
    if (fileInput) {
        fileInput.removeAttribute('required');
    }

    // Clear temporary filename input to avoid submitting old data
    if (tempFilenameInput) {
        tempFilenameInput.value = '';
    }

    // Run loaders, set endpoint to /demo, and submit
    runProgressAnimation(() => {
        form.action = '/demo';
        form.submit();
    });
}

/* =============================================
   8. CENTRAL STATE SYNCHRONIZATION ENGINE
   ============================================= */
function renderDashboardState(data) {
    if (!data) return;

    // Cache current active payload for theme change redraws
    window.currentActiveScanPayload = data;

    // ── Update Filename ──
    const filenameLabel = document.getElementById('overview-filename-label');
    if (filenameLabel) {
        filenameLabel.textContent = data.filename || "Alexander_Davis_Lead_Dev.pdf";
    }

    // ── Update Core Metrics ──
    const maxOffset = 263.89; // 2 * Math.PI * 42
    
    if (data.metrics) {
        // Animate Circular Gauges
        const gauges = [
            { id: 'gauge-final', score: data.metrics.final_score || 0 },
            { id: 'gauge-skill', score: data.metrics.skill_match || 0 },
            { id: 'gauge-semantic', score: data.metrics.semantic_match || 0 }
        ];
        
        gauges.forEach(g => {
            const el = document.getElementById(g.id);
            if (el) {
                const offset = maxOffset - (Math.min(100, Math.max(0, g.score)) / 100) * maxOffset;
                el.style.strokeDashoffset = offset;
            }
        });

        // Update Text Values inside Gauges
        const textFinal = document.getElementById('text-gauge-final');
        if (textFinal) textFinal.textContent = `${Math.round(data.metrics.final_score || 0)}%`;

        const textSkill = document.getElementById('text-gauge-skill');
        if (textSkill) textSkill.textContent = `${Math.round(data.metrics.skill_match || 0)}%`;

        const textSemantic = document.getElementById('text-gauge-semantic');
        if (textSemantic) textSemantic.textContent = `${Math.round(data.metrics.semantic_match || 0)}%`;

        // Profile Strength / Level
        const profileLevelText = document.getElementById('text-profile-strength');
        if (profileLevelText) {
            profileLevelText.textContent = data.metrics.badge || (data.metrics.final_score >= 80 ? 'Senior' : (data.metrics.final_score >= 60 ? 'Intermediate' : 'Junior'));
        }

        const profileStrengthIcon = document.getElementById('profile-strength-icon');
        if (profileStrengthIcon) {
            const badge = data.metrics.badge || '';
            let iconName = 'verified';
            if (badge === 'Beginner' || data.metrics.final_score < 40) iconName = 'info';
            else if (badge === 'Intermediate' || data.metrics.final_score < 70) iconName = 'trending_up';
            else iconName = 'verified';
            profileStrengthIcon.innerHTML = `<span class="material-symbols-outlined" style="font-size:32px;">${iconName}</span>`;
        }
    }

    // ── OVERVIEW TAB: Profile Strengths ──
    const overviewWinsWrapper = document.getElementById('overview-wins-wrapper');
    if (overviewWinsWrapper) {
        let winsHtml = '';

        if (data.quick_wins && data.quick_wins.length > 0) {
            data.quick_wins.forEach(win => {
                winsHtml += `
                    <div class="cl-win-item">
                        <div class="cl-win-header">
                            <span class="cl-win-title">${win.title}</span>
                            <span class="cl-pill cl-pill-match" style="font-size:9px;">${win.points || '+10 pts'}</span>
                        </div>
                        <p class="cl-win-desc">${win.description}</p>
                    </div>
                `;
            });
        }

        // Add structural strengths from checklist if quick_wins is short
        if (data.checklist) {
            if (data.checklist.projects && (!data.quick_wins || data.quick_wins.length < 3)) {
                winsHtml += `
                    <div class="cl-win-item">
                        <div class="cl-win-header">
                            <span class="cl-win-title">Projects Architecture Identified</span>
                            <span class="cl-pill cl-pill-match" style="font-size:9px;">+15 pts</span>
                        </div>
                        <p class="cl-win-desc">Practical project section highlights direct technical implementation and architecture patterns.</p>
                    </div>
                `;
            }
            if (data.checklist.experience && (!data.quick_wins || data.quick_wins.length < 2)) {
                winsHtml += `
                    <div class="cl-win-item">
                        <div class="cl-win-header">
                            <span class="cl-win-title">Work Experience Structure</span>
                            <span class="cl-pill cl-pill-match" style="font-size:9px;">+20 pts</span>
                        </div>
                        <p class="cl-win-desc">Clear chronology and employer history readily parsed by Applicant Tracking Systems.</p>
                    </div>
                `;
            }
        }

        if (!winsHtml) {
            winsHtml = '<div style="padding:24px 0;text-align:center;font-size:12px;color:var(--text-muted);">Baseline structural parsing established.</div>';
        }
        overviewWinsWrapper.innerHTML = winsHtml;
    }

    // ── OVERVIEW TAB: Critical Improvements ──
    const overviewSuggestionsWrapper = document.getElementById('overview-suggestions-wrapper');
    if (overviewSuggestionsWrapper) {
        let suggestionsHtml = '';
        if (data.suggestions && data.suggestions.length > 0) {
            // Prioritize High and Medium priority suggestions for overview
            const prioritySuggestions = data.suggestions.slice(0, 3);
            prioritySuggestions.forEach(sugg => {
                const priorityClass = (sugg.priority || 'medium').toLowerCase();
                suggestionsHtml += `
                    <div class="cl-suggestion-item ${priorityClass}">
                        <div class="cl-suggestion-header">
                            <span class="cl-suggestion-title">${sugg.title}</span>
                            <span class="cl-pill ${priorityClass === 'high' ? 'cl-pill-miss' : 'cl-pill-warn'}" style="font-size:9px;">${sugg.priority || 'Priority'}</span>
                        </div>
                        <p class="cl-suggestion-desc">${sugg.description}</p>
                    </div>
                `;
            });
        }
        if (!suggestionsHtml) {
            suggestionsHtml = '<div style="padding:24px 0;text-align:center;font-size:12px;color:var(--accent-match);">No critical improvements identified. Excellent score!</div>';
        }
        overviewSuggestionsWrapper.innerHTML = suggestionsHtml;
    }

    // ── ANALYSIS TAB: ATS Compliance Checklist & Diagnostics ──
    const complianceWrapper = document.getElementById('analysis-compliance-wrapper');
    if (complianceWrapper) {
        let complianceHtml = '';

        // Real compliance values
        if (data.compliance) {
            if (data.compliance.keyword_density) {
                const stat = data.compliance.keyword_density.status || 'Good';
                const isWarn = stat === 'Review' || stat === 'Low';
                complianceHtml += `
                    <div class="cl-compliance-row">
                        <span class="cl-compliance-label">
                            <span class="material-symbols-outlined" style="font-size:15px;color:${isWarn ? 'var(--accent-warn)' : 'var(--accent-match)'};">${isWarn ? 'warning' : 'check_circle'}</span>
                            Keyword Density
                        </span>
                        <span class="cl-pill ${isWarn ? 'cl-pill-warn' : 'cl-pill-match'}" style="font-size:9px;">${stat}</span>
                    </div>
                `;
            }
            if (data.compliance.file_format) {
                complianceHtml += `
                    <div class="cl-compliance-row">
                        <span class="cl-compliance-label">
                            <span class="material-symbols-outlined" style="font-size:15px;color:var(--accent-match);">check_circle</span>
                            File Format
                        </span>
                        <span class="cl-pill cl-pill-match" style="font-size:9px;">${data.compliance.file_format.status || 'Passed'}</span>
                    </div>
                `;
            }
            if (data.compliance.complex_formatting) {
                const stat = data.compliance.complex_formatting.status || 'Clean';
                const isWarn = stat === 'Review';
                complianceHtml += `
                    <div class="cl-compliance-row">
                        <span class="cl-compliance-label">
                            <span class="material-symbols-outlined" style="font-size:15px;color:${isWarn ? 'var(--accent-warn)' : 'var(--accent-match)'};">${isWarn ? 'warning' : 'check_circle'}</span>
                            Complex Formatting
                        </span>
                        <span class="cl-pill ${isWarn ? 'cl-pill-warn' : 'cl-pill-match'}" style="font-size:9px;">${stat}</span>
                    </div>
                `;
            }
        }

        // Structural Checklist Items
        if (data.checklist) {
            const checks = [
                { name: 'Contact Information', val: data.checklist.contact_info },
                { name: 'Work Experience Section', val: data.checklist.experience },
                { name: 'Skills Section', val: data.checklist.skills },
                { name: 'Projects Section', val: data.checklist.projects },
                { name: 'Education Section', val: data.checklist.education },
                { name: 'LinkedIn Link', val: data.checklist.linkedin },
                { name: 'GitHub Link', val: data.checklist.github }
            ];

            checks.forEach(c => {
                complianceHtml += `
                    <div class="cl-compliance-row">
                        <span class="cl-compliance-label">
                            <span class="material-symbols-outlined" style="font-size:15px;color:${c.val ? 'var(--accent-match)' : 'var(--accent-miss)'};">${c.val ? 'check_circle' : 'cancel'}</span>
                            ${c.name}
                        </span>
                        <span class="cl-pill ${c.val ? 'cl-pill-match' : 'cl-pill-miss'}" style="font-size:9px;">${c.val ? 'PASS' : 'MISSING'}</span>
                    </div>
                `;
            });
        }

        // Parsing Diagnostics Grid
        if (data.details) {
            complianceHtml += `
                <div class="cl-diagnostic-grid" style="margin-top:16px;">
                    <div class="cl-diagnostic-item">
                        <div class="label-mono" style="margin-bottom:2px;">Parse Method</div>
                        <div style="font-size:12px;font-weight:600;color:var(--text-primary);">${data.extraction_method || 'PDF Text Parsing'}</div>
                    </div>
                    <div class="cl-diagnostic-item">
                        <div class="label-mono" style="margin-bottom:2px;">Action Verbs</div>
                        <div style="font-size:12px;font-weight:600;color:var(--text-primary);">${data.details.action_verb_count || 0} verbs detected</div>
                    </div>
                    <div class="cl-diagnostic-item">
                        <div class="label-mono" style="margin-bottom:2px;">Metrics / Quantifiers</div>
                        <div style="font-size:12px;font-weight:600;color:var(--text-primary);">${data.details.metric_count || 0} quantifiable points</div>
                    </div>
                    <div class="cl-diagnostic-item">
                        <div class="label-mono" style="margin-bottom:2px;">Resume Strength</div>
                        <div style="font-size:12px;font-weight:600;color:var(--text-primary);">${Math.round(data.metrics ? data.metrics.resume_strength || 0 : 0)}% score</div>
                    </div>
                </div>
            `;
        }

        complianceWrapper.innerHTML = complianceHtml;
    }

    // ── ANALYSIS TAB: Actionable Optimization Roadmap ──
    const roadmapWrapper = document.getElementById('analysis-roadmap-wrapper');
    if (roadmapWrapper) {
        let roadmapHtml = '';
        if (data.roadmap_timeline && data.roadmap_timeline.length > 0) {
            data.roadmap_timeline.forEach((step, idx) => {
                roadmapHtml += `
                    <div class="cl-timeline-step">
                        <div class="cl-timeline-dot ${idx === 0 ? 'first' : ''}"></div>
                        <div class="cl-timeline-days">${step.days || `PHASE ${idx+1}`}</div>
                        <div class="cl-timeline-title">${step.title}</div>
                        <p class="cl-timeline-desc">${step.description}</p>
                    </div>
                `;
            });
        } else {
            roadmapHtml = `
                <div class="cl-timeline-step">
                    <div class="cl-timeline-dot first"></div>
                    <div class="cl-timeline-days">CURRENT</div>
                    <div class="cl-timeline-title">Maintain Optimal Profile</div>
                    <p class="cl-timeline-desc">No critical gaps detected. Keep refining project descriptions with measurable business impact.</p>
                </div>
            `;
        }
        roadmapWrapper.innerHTML = roadmapHtml;
    }

    // ── ANALYSIS TAB: Full Suggestions Matrix ──
    const fullSuggestionsWrapper = document.getElementById('analysis-full-suggestions-wrapper');
    if (fullSuggestionsWrapper) {
        let fullSuggHtml = '';
        if (data.suggestions && data.suggestions.length > 0) {
            data.suggestions.forEach(sugg => {
                const priorityClass = (sugg.priority || 'medium').toLowerCase();
                fullSuggHtml += `
                    <div class="cl-suggestion-item ${priorityClass}">
                        <div class="cl-suggestion-header">
                            <div>
                                <span class="cl-suggestion-title">${sugg.title}</span>
                                <span class="label-mono" style="margin-left:8px;font-size:10px;">${sugg.category || 'General'}</span>
                            </div>
                            <span class="cl-pill ${priorityClass === 'high' ? 'cl-pill-miss' : (priorityClass === 'medium' ? 'cl-pill-warn' : 'cl-pill-neutral')}" style="font-size:9px;">${sugg.priority || 'Normal'}</span>
                        </div>
                        <p class="cl-suggestion-desc">${sugg.description}</p>
                    </div>
                `;
            });
        } else {
            fullSuggHtml = '<div style="padding:32px 0;text-align:center;font-size:12px;color:var(--accent-match);">Your resume adheres perfectly to all standard ATS recommendations.</div>';
        }
        fullSuggestionsWrapper.innerHTML = fullSuggHtml;
    }

    // ── SKILLS TAB: Matched Skills & Keywords ──
    const matchedWrapper = document.getElementById('skills-matched-wrapper');
    if (matchedWrapper) {
        let matchedHtml = '';
        if (data.skills && data.skills.matching && Object.keys(data.skills.matching).length > 0) {
            for (const [category, skillList] of Object.entries(data.skills.matching)) {
                if (skillList && skillList.length > 0) {
                    matchedHtml += `
                        <div style="margin-bottom:18px;">
                            <div class="label-mono" style="color:var(--text-primary);margin-bottom:8px;font-weight:600;">${category}</div>
                            <div style="display:flex;flex-wrap:wrap;gap:6px;">
                    `;
                    skillList.forEach(skill => {
                        const skillName = typeof skill === 'object' ? skill.name : skill;
                        matchedHtml += `
                            <span class="cl-skill-pill-match">
                                <span class="material-symbols-outlined" style="font-size:12px;">check</span>
                                ${skillName}
                            </span>
                        `;
                    });
                    matchedHtml += `
                            </div>
                        </div>
                    `;
                }
            }
        }
        if (!matchedHtml) {
            matchedHtml = `
                <div style="padding:32px 0;text-align:center;">
                    <span class="material-symbols-outlined" style="font-size:32px;color:var(--text-muted);display:block;margin-bottom:8px;opacity:0.5;">search_off</span>
                    <p style="font-size:12px;color:var(--text-muted);">No direct matching keywords found for this role description.</p>
                </div>
            `;
        }
        matchedWrapper.innerHTML = matchedHtml;
    }

    // ── SKILLS TAB: Missing Required Skills ──
    const missingWrapper = document.getElementById('skills-missing-wrapper');
    if (missingWrapper) {
        let missingHtml = '';
        let flatIdx = 1;
        
        if (data.skills && data.skills.missing && Object.keys(data.skills.missing).length > 0) {
            for (const [category, skillList] of Object.entries(data.skills.missing)) {
                if (skillList && skillList.length > 0) {
                    skillList.forEach(skill => {
                        const skillName = typeof skill === 'object' ? skill.name : skill;
                        const difficulty = (typeof skill === 'object' && skill.difficulty) ? skill.difficulty : 'Medium';
                        const estTime = (typeof skill === 'object' && skill.est_time) ? skill.est_time : '7 Days';

                        missingHtml += `
                            <div class="cl-skill-item">
                                <div class="cl-skill-header" onclick="toggleSkillCollapse(this)" aria-expanded="${flatIdx === 1 ? 'true' : 'false'}">
                                    <div>
                                        <div class="cl-skill-name">${skillName}</div>
                                        <div class="cl-skill-cat">${category} · Est. ${estTime}</div>
                                    </div>
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <span class="cl-pill cl-pill-neutral" style="font-size:9px;">${difficulty}</span>
                                        <span class="collapse-icon-lens"><span class="material-symbols-outlined" style="font-size:16px;color:var(--text-muted);">expand_more</span></span>
                                    </div>
                                </div>
                                
                                <div class="cl-skill-body ${flatIdx === 1 ? 'expanded' : ''}">
                                    <div class="label-mono" style="margin-bottom:4px;">Why it Matters</div>
                                    <p style="font-size:11px;color:var(--text-muted);line-height:1.5;margin-bottom:10px;">
                                        This skill was explicitly required in the target job requirements. Incorporating it with practical project experience improves your ATS ranking probability.
                                    </p>
                                    <div class="label-mono" style="margin-bottom:4px;">Priority Impact</div>
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div class="cl-importance-bar" style="flex:1;"><div class="cl-importance-fill" style="width:85%;"></div></div>
                                        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-primary);">High</span>
                                    </div>
                                </div>
                            </div>
                        `;
                        flatIdx++;
                    });
                }
            }
        }
        if (!missingHtml) {
            missingHtml = `
                <div style="padding:32px 0;text-align:center;">
                    <span class="material-symbols-outlined" style="font-size:32px;color:var(--accent-match);display:block;margin-bottom:8px;">check_circle</span>
                    <p style="font-size:12px;color:var(--text-muted);">No missing skills. Perfect keyword compliance!</p>
                </div>
            `;
        }
        missingWrapper.innerHTML = missingHtml;
    }

    // ── ANALYTICS TAB: Matched & Missing Summary Pills ──
    const matchedPillsWrapper = document.getElementById('analytics-matched-skills-pills');
    if (matchedPillsWrapper) {
        let matchedPills = '';
        if (data.skills && data.skills.matching) {
            for (const [cat, skillList] of Object.entries(data.skills.matching)) {
                if (skillList && skillList.length > 0) {
                    skillList.forEach(s => {
                        const sName = typeof s === 'object' ? s.name : s;
                        matchedPills += `<span class="cl-skill-pill-match"><span class="material-symbols-outlined" style="font-size:11px;">check</span>${sName}</span>`;
                    });
                }
            }
        }
        if (!matchedPills) matchedPills = '<span style="font-size:11px;color:var(--text-muted);">No matched keywords.</span>';
        matchedPillsWrapper.innerHTML = matchedPills;
    }

    const missingPillsWrapper = document.getElementById('analytics-missing-skills-pills');
    if (missingPillsWrapper) {
        let missingPills = '';
        if (data.skills && data.skills.missing) {
            for (const [cat, skillList] of Object.entries(data.skills.missing)) {
                if (skillList && skillList.length > 0) {
                    skillList.forEach(s => {
                        const sName = typeof s === 'object' ? s.name : s;
                        missingPills += `<span class="cl-skill-pill-miss"><span class="material-symbols-outlined" style="font-size:11px;">close</span>${sName}</span>`;
                    });
                }
            }
        }
        if (!missingPills) missingPills = '<span style="font-size:11px;color:var(--accent-match);">No keywords missing! Perfect match.</span>';
        missingPillsWrapper.innerHTML = missingPills;
    }

    // ── ANALYTICS TAB: Category Progress Bars ──
    const analyticsCategoriesWrapper = document.getElementById('analytics-categories-wrapper');
    if (analyticsCategoriesWrapper) {
        let categoriesHtml = '';
        if (data.skills && data.skills.category_progress && data.skills.category_progress.length > 0) {
            data.skills.category_progress.forEach(cat => {
                const cov = Math.round(cat.coverage || 0);
                categoriesHtml += `
                    <div class="cl-bar-row">
                        <div class="cl-bar-label-row">
                            <span style="font-size:12px;font-weight:600;color:var(--text-primary);">${cat.category}</span>
                            <span class="label-mono">${cat.matched}/${cat.total} · ${cov}%</span>
                        </div>
                        <div class="cl-bar-track">
                            <div class="cl-bar-fill" style="width:${cov}%;"></div>
                        </div>
                    </div>
                `;
            });
        }
        if (!categoriesHtml) categoriesHtml = '<div style="padding:24px 0;text-align:center;font-size:12px;color:var(--text-muted);">No category breakdown available.</div>';
        analyticsCategoriesWrapper.innerHTML = categoriesHtml;
    }

    // ── Update Charts (Chart.js instance rebuilds) ──
    rebuildCharts(data);
}

/**
 * Destroys existing charts if present and constructs the Competency Radar and Score Breakdown charts.
 */
function rebuildCharts(data) {
    if (!data || typeof Chart === 'undefined') return;

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const chartFontColor = isLight ? '#475569' : '#a1a1aa';
    const chartGridColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.06)';

    const radarStroke = isLight ? '#09090b' : 'rgba(255,255,255,0.85)';
    const radarFill = isLight ? 'rgba(9, 9, 11, 0.07)' : 'rgba(255,255,255,0.06)';
    const radarTargetStroke = isLight ? 'rgba(0, 0, 0, 0.22)' : 'rgba(255,255,255,0.18)';

    // 1. Rebuild Competency Radar Chart
    const radarCanvas = document.getElementById('competencyRadarChart');
    if (radarCanvas) {
        if (window.radarChartInstance) {
            window.radarChartInstance.destroy();
            window.radarChartInstance = null;
        }

        const categories = [];
        const coverageData = [];
        const targetData = [];

        if (data.skills && data.skills.category_progress && data.skills.category_progress.length > 0) {
            data.skills.category_progress.forEach(cat => {
                categories.push(cat.category);
                coverageData.push(Math.round(cat.coverage || 0));
                targetData.push(100);
            });
        } else {
            categories.push('Languages', 'Frameworks', 'Databases', 'Cloud', 'Tools');
            coverageData.push(60, 80, 50, 70, 90);
            targetData.push(100, 100, 100, 100, 100);
        }

        window.radarChartInstance = new Chart(radarCanvas, {
            type: 'radar',
            data: {
                labels: categories,
                datasets: [
                    {
                        label: 'Candidate Skills (%)',
                        data: coverageData,
                        backgroundColor: radarFill,
                        borderColor: radarStroke,
                        borderWidth: 2,
                        pointBackgroundColor: radarStroke,
                        pointBorderColor: '#ffffff',
                        pointHoverBackgroundColor: '#ffffff',
                        pointHoverBorderColor: radarStroke,
                        pointRadius: 4
                    },
                    {
                        label: 'Target Requirements (%)',
                        data: targetData,
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        borderColor: radarTargetStroke,
                        borderWidth: 1.5,
                        borderDash: [5, 5],
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: chartGridColor },
                        grid: { color: chartGridColor },
                        ticks: { display: false, backdropColor: 'transparent' },
                        suggestedMin: 0,
                        suggestedMax: 100,
                        pointLabels: {
                            color: chartFontColor,
                            font: { family: 'Plus Jakarta Sans', size: 10, weight: '600' }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: chartFontColor,
                            font: { family: 'Plus Jakarta Sans', size: 11 },
                            boxWidth: 12
                        }
                    }
                }
            }
        });
    }

    // 2. Rebuild Score Breakdown Bar Chart
    const barCanvas = document.getElementById('scoreBreakdownBarChart');
    if (barCanvas) {
        if (window.donutChartInstance) {
            window.donutChartInstance.destroy();
            window.donutChartInstance = null;
        }

        const metrics = data.metrics || {};
        const scoreLabels = ['Overall ATS', 'Skill Match', 'Semantic Fit', 'Resume Strength'];
        const scoreValues = [
            Math.round(metrics.final_score || 0),
            Math.round(metrics.skill_match || 0),
            Math.round(metrics.semantic_match || 0),
            Math.round(metrics.resume_strength || 0)
        ];

        window.donutChartInstance = new Chart(barCanvas, {
            type: 'bar',
            data: {
                labels: scoreLabels,
                datasets: [{
                    label: 'Score (%)',
                    data: scoreValues,
                    backgroundColor: [
                        isLight ? 'rgba(9, 9, 11, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                        'rgba(16, 185, 129, 0.8)',
                        isLight ? 'rgba(100, 116, 139, 0.8)' : 'rgba(161, 161, 170, 0.8)',
                        isLight ? 'rgba(59, 130, 246, 0.8)' : 'rgba(96, 165, 250, 0.8)'
                    ],
                    borderColor: 'transparent',
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: chartFontColor,
                            font: { family: 'Plus Jakarta Sans', size: 10, weight: '600' }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: chartGridColor },
                        ticks: {
                            color: chartFontColor,
                            font: { family: 'JetBrains Mono', size: 10 },
                            stepSize: 25,
                            callback: value => `${value}%`
                        }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

/**
 * Event-bindable function to toggle skill card expansion.
 */
function toggleSkillCollapse(header) {
    const body = header.nextElementSibling;
    const iconEl = header.querySelector('.collapse-icon-lens .material-symbols-outlined');
    
    if (body.classList.contains('expanded')) {
        body.classList.remove('expanded');
        if (iconEl) iconEl.textContent = 'expand_more';
    } else {
        body.classList.add('expanded');
        if (iconEl) iconEl.textContent = 'expand_less';
    }
}

let cachedHistoryData = [];

function renderHistoryTab() {
    const listWrapper = document.getElementById('history-list-wrapper');
    if (!listWrapper) return;

    fetch('/api/history')
    .then(response => response.json())
    .then(history => {
        cachedHistoryData = history || [];
        renderHistoryCards(cachedHistoryData);
    })
    .catch(err => {
        console.error("Error fetching history:", err);
        listWrapper.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--accent-miss);font-size:12px;">Error loading scan history from server.</div>`;
    });
}

function renderHistoryCards(items) {
    const listWrapper = document.getElementById('history-list-wrapper');
    if (!listWrapper) return;

    if (!items || items.length === 0) {
        listWrapper.innerHTML = `
            <div style="text-align:center;padding:64px 20px;">
                <span class="material-symbols-outlined" style="font-size:48px;color:var(--text-muted);display:block;margin-bottom:8px;opacity:0.4;">history</span>
                <p style="font-size:13px;color:var(--text-muted);">No previous scan reports found in this session.</p>
            </div>
        `;
        return;
    }

    let html = '<div class="history-grid-lens">';
    items.forEach(run => {
        const formattedDate = new Date(run.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const score = run.final_score ? Math.round(run.final_score) : 0;
        html += `
            <div class="cl-history-card" onclick="reloadHistoricalScan(${run.id})" role="button" tabindex="0"
                 onkeydown="if(event.key==='Enter')reloadHistoricalScan(${run.id})"
                 aria-label="Load scan for ${run.filename}, score ${score}">
                <div class="cl-history-card-top">
                    <div>
                        <div class="label-mono" style="margin-bottom:3px;">File Name</div>
                        <div style="font-size:13px;font-weight:600;color:var(--text-primary);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${run.filename}</div>
                    </div>
                    <div style="text-align:right;">
                        <div class="label-mono" style="margin-bottom:3px;">Scanned</div>
                        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-secondary);">${formattedDate}</div>
                    </div>
                </div>

                <div class="cl-history-score-row">
                    <span class="label-mono">ATS Score</span>
                    <span style="font-family:var(--font-head);font-size:20px;font-weight:700;color:var(--text-primary);">${score}</span>
                </div>
                <div class="cl-history-bar-track">
                    <div class="cl-history-bar-fill" style="width:${Math.min(score, 100)}%;"></div>
                </div>

                <div class="cl-history-card-footer">
                    <div>
                        <div class="label-mono" style="margin-bottom:2px;">Method</div>
                        <span style="font-size:11px;color:var(--text-secondary);">${run.extraction_method || 'General PDF'}</span>
                    </div>
                    <span class="cl-pill cl-pill-neutral">View</span>
                </div>
            </div>
        `;
    });
    html += '</div>';
    listWrapper.innerHTML = html;
}

function filterHistoryList(query) {
    if (!cachedHistoryData) return;
    const q = (query || '').toLowerCase().trim();
    if (!q) {
        renderHistoryCards(cachedHistoryData);
        return;
    }
    const filtered = cachedHistoryData.filter(item => 
        (item.filename && item.filename.toLowerCase().includes(q)) ||
        (item.extraction_method && item.extraction_method.toLowerCase().includes(q))
    );
    renderHistoryCards(filtered);
}

let historySortAsc = false;
function sortHistory(criteria) {
    if (!cachedHistoryData || cachedHistoryData.length === 0) return;
    if (criteria === 'score') {
        cachedHistoryData.sort((a, b) => historySortAsc ? (a.final_score - b.final_score) : (b.final_score - a.final_score));
    } else {
        cachedHistoryData.sort((a, b) => historySortAsc ? (new Date(a.timestamp) - new Date(b.timestamp)) : (new Date(b.timestamp) - new Date(a.timestamp)));
    }
    historySortAsc = !historySortAsc;
    renderHistoryCards(cachedHistoryData);
}

/**
 * Reloads a historical scan from the database, updates session results, and redraws gauges/charts.
 */
function reloadHistoricalScan(scanId) {
    fetch(`/api/history/${scanId}`)
    .then(response => response.json())
    .then(data => {
        if (!data.success || !data.results) {
            alert("Could not load report logs.");
            return;
        }

        // Synchronize all UI metrics, timelines, lists, charts
        renderDashboardState(data.results);

        // Smooth transition to Overview tab
        const overviewLink = document.querySelector('.sidebar-link-lens[data-tab="overview"]');
        if (overviewLink) {
            overviewLink.click();
        }
    })
    .catch(err => {
        console.error("Error loading scan:", err);
        alert("Failed to connect to the database to reload scan.");
    });
}

/**
 * Clears all scan history for the current visitor in the database.
 */
function clearDatabaseHistory() {
    if (confirm("Are you sure you want to permanently erase your scan history logs?")) {
        fetch('/api/history/clear', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update cached history memory & re-render empty state dynamically
                cachedHistoryData = [];
                renderHistoryCards([]);

                // Close settings modal if open
                const modalEl = document.getElementById('settingsModal');
                if (modalEl && typeof bootstrap !== 'undefined') {
                    const modalInstance = bootstrap.Modal.getInstance(modalEl);
                    if (modalInstance) {
                        modalInstance.hide();
                    }
                }

                // Show subtle confirmation alert
                alert("Scan history cleared successfully.");
            } else {
                alert("Failed to clear database logs.");
            }
        })
        .catch(err => {
            console.error("Error clearing logs:", err);
            alert("Error connecting to server to clear logs.");
        });
    }
}

/**
 * Opens and smoothly scrolls to the upload drawer.
 */
function openUploadDrawer() {
    const uploadDrawer = document.getElementById('upload-drawer');
    const triggerUploadBtn = document.getElementById('analyze-trigger-btn');
    if (uploadDrawer) {
        uploadDrawer.style.display = 'block';
        if (triggerUploadBtn) triggerUploadBtn.setAttribute('aria-expanded', 'true');
        setTimeout(() => {
            uploadDrawer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const dropArea = document.getElementById('upload-area');
            if (dropArea) {
                dropArea.style.borderColor = 'var(--text-primary)';
                dropArea.style.boxShadow = '0 0 0 3px rgba(255, 255, 255, 0.2)';
                setTimeout(() => {
                    dropArea.style.borderColor = '';
                    dropArea.style.boxShadow = '';
                }, 1800);
            }
        }, 50);
    }
}

/**
 * Smoothly scrolls to the upload section and highlights the dropzone.
 */
function scrollToUploadSection() {
    openUploadDrawer();
}

/**
 * Fill a sample role requirements description into the textarea.
 */
function useSample(role) {
    const jdField = document.getElementById('job-description');

    const SAMPLE_JDS = {
        swe: `Software Engineer\nResponsibilities:\n- Design and develop scalable backend applications in Python and Java.\n- Write clean, maintainable, and efficient SQL queries.\n- Build web interfaces and integrate REST APIs.\n- Collaborate using Git/GitHub.\nRequirements:\n- Strong knowledge of Python, Java, and SQL.\n- Experience with Flask, Django, and PostgreSQL.\n- Understanding of Docker, CI/CD, and Cloud (AWS/GCP).\n- Excellent communication and software engineering principles.`,

        frontend: `Frontend Developer\nResponsibilities:\n- Build responsive, beautiful, and interactive web applications.\n- Collaborate with designers to translate wireframes into high-quality code.\n- Optimize frontend components for maximum speed and scalability.\nRequirements:\n- Expert level HTML, CSS, JavaScript, and Tailwind CSS.\n- Extensive experience with React, Next.js, and TypeScript.\n- Strong familiarity with Git, npm, Webpack, and version control.\n- Good knowledge of UI/UX design patterns.`,

        backend: `Backend Developer\nResponsibilities:\n- Develop secure and high-performance server-side APIs.\n- Manage and design relational and non-relational database schemas.\n- Implement containerized deployments using Docker and Kubernetes.\nRequirements:\n- Proficient in Node.js, Express, and FastAPI.\n- Hands-on experience with SQL, PostgreSQL, MongoDB, and Redis.\n- Deep understanding of REST APIs, GraphQL, and security protocols.\n- Familiarity with CI/CD pipelines, Docker, Kubernetes, and AWS.`,

        data: `Data Analyst\nResponsibilities:\n- Collect, clean, and analyze complex datasets to drive business decisions.\n- Create automated reports and interactive dashboards.\n- Write complex database queries to extract insight.\nRequirements:\n- Strong programming skills in Python and SQL.\n- Mastery of Pandas, NumPy, and Scikit-Learn for analysis.\n- Experience with Postgres, MySQL, and Excel.\n- Excellent data visualization skills and statistical background.`,

        ml: `Machine Learning Engineer\nResponsibilities:\n- Build, train, and deploy production-grade machine learning models.\n- Optimize neural network architectures for computer vision and NLP.\n- Create data processing pipelines and train models at scale.\nRequirements:\n- Strong background in Python, PyTorch, and TensorFlow.\n- Experience with Machine Learning, Deep Learning, NLP, and Computer Vision.\n- Good knowledge of Pandas, NumPy, Keras, and Scikit-Learn.\n- Familiarity with Docker, AWS, and model deployment APIs.`
    };

    if (jdField && SAMPLE_JDS[role]) {
        jdField.value = SAMPLE_JDS[role];
        jdField.style.transition = 'box-shadow 0.3s ease';
        jdField.style.boxShadow = '0 0 0 3px rgba(255, 255, 255, 0.15)';
        setTimeout(() => {
            jdField.style.boxShadow = 'none';
        }, 1500);
    }
}

/**
 * Initializes IntersectionObserver to reveal elements as the user scrolls.
 */
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    if (revealElements.length === 0) return;

    if (!('IntersectionObserver' in window)) {
        // Fallback: reveal everything immediately
        revealElements.forEach(el => el.classList.add('revealed'));
        return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0, rootMargin: '0px 0px -20px 0px' });

    revealElements.forEach(el => observer.observe(el));

    // Immediately trigger reveal for elements already in viewport on page load
    // This handles the hero and any above-fold content that IntersectionObserver
    // may not fire for synchronously on initial render
    requestAnimationFrame(() => {
        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                el.classList.add('revealed');
                observer.unobserve(el);
            }
        });
    });
}

/* =============================================
   9. THEME MANAGEMENT SYSTEM (OBSIDIAN & LIGHT)
   ============================================= */
/**
 * Initializes the theme state from localStorage and attaches event listeners.
 */
function initTheme() {
    const savedTheme = localStorage.getItem('cl_theme') || 'dark';
    applyTheme(savedTheme, false);

    // Bind all theme toggles across pages and sidebars
    const toggleBtns = document.querySelectorAll('#theme-toggle-btn, #theme-toggle-sidebar-btn, .theme-toggle-action');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // If it's a specific action button inside modal with explicit onclick, let onclick handle it
            if (btn.classList.contains('theme-toggle-action')) return;
            e.preventDefault();
            toggleTheme();
        });
    });
}

/**
 * Toggles between 'dark' and 'light' themes.
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme, true);
}

/**
 * Applies the given theme, updates DOM attributes, localStorage, icons, and redraws charts.
 */
function applyTheme(theme, redrawCharts = true) {
    const normalizedTheme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', normalizedTheme);
    localStorage.setItem('cl_theme', normalizedTheme);

    // Update Theme Toggle Icons (Sun for dark mode, Moon for light mode)
    const themeIcons = document.querySelectorAll('#theme-icon, #theme-icon-sidebar');
    themeIcons.forEach(icon => {
        icon.textContent = normalizedTheme === 'dark' ? 'light_mode' : 'dark_mode';
    });

    // Update Sidebar label text if present
    const sidebarThemeText = document.getElementById('theme-text-sidebar');
    if (sidebarThemeText) {
        sidebarThemeText.textContent = normalizedTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }

    // Rebuild Chart.js canvas if dashboard scan data is active
    if (redrawCharts && window.currentActiveScanPayload) {
        rebuildCharts(window.currentActiveScanPayload);
    }
}
