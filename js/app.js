/* ==========================================================
 * 新生校园活动广场 · 交互逻辑
 * 纯原生 JavaScript（ES6+），无任何框架与网络请求
 * 数据说明：
 *   - 5 条初始活动以内置常量形式提供（双击 index.html 即可运行，
 *     避免 file:// 协议下 fetch 本地 JSON 被浏览器拦截）
 *   - 学生发布的活动、报名/取消报名记录均保存在 localStorage
 * ========================================================== */

(function () {
    'use strict';

    /* ----------------------------------------------------------
     * 一、常量与初始数据
     * -------------------------------------------------------- */

    // 分类字典（图标、名称、卡片主题 class 与 CSS 变量对应）
    const CATEGORIES = {
        competition: { name: '竞赛', icon: '🏆' },
        lecture:     { name: '讲座', icon: '🎤' },
        project:     { name: '项目招募', icon: '🚀' },
        volunteer:   { name: '志愿活动', icon: '💚' }
    };

    // 状态字典：open 可报名 / direct 无需报名 / closed 已截止 / ended 已结束
    const STATUS = {
        open:   { name: '可报名', cls: 'badge-open' },
        direct: { name: '无需报名', cls: 'badge-direct' },
        closed: { name: '已截止', cls: 'badge-closed' },
        ended:  { name: '已结束', cls: 'badge-ended' }
    };

    // 本地存储键名
    const LS_CUSTOM = 'campus_hub_custom_activities_v1';
    const LS_STATE  = 'campus_hub_signup_state_v1';

    // 内置 5 条初始活动（年份 2026，与“今天 2026-09-19”对照计算状态）
    const INITIAL_ACTIVITIES = [
        {
            id: 'init-1',
            title: '“蓝桥杯”程序设计校内训练营',
            category: 'competition',
            icon: '🏆',
            location: '校内机房（开营前短信通知具体教室）',
            startTime: '2026-09-20T19:00',
            endTime: null,
            timeText: '9月20日起 每周六 19:00 训练',
            mode: 'signup',
            deadline: '2026-09-24T22:00',
            audience: '全校学生（零基础可参加）',
            baseSignup: 186,
            desc: '面向全校学生的“蓝桥杯”程序设计大赛备赛训练营，从零开始系统讲解算法基础与历年真题。每周六晚集中训练，配有学长学姐答疑与模拟赛，表现优异者可优先推荐进入校队。',
            highlights: ['零基础友好，从语法与常见算法讲起', '每周六 19:00 固定训练，共 6 期', '配套真题讲解 + 模拟排位赛', '优秀学员优先入选校队'],
            forceEnded: false
        },
        {
            id: 'init-2',
            title: 'AI 应用入门公开课',
            category: 'lecture',
            icon: '🤖',
            location: '计算机学院教学楼 A 座报告厅',
            startTime: '2026-09-19T19:00',
            endTime: '2026-09-19T20:30',
            timeText: null,
            mode: 'direct',
            deadline: null,
            audience: '全校学生',
            baseSignup: 0,
            desc: '一场面向所有专业新生的 AI 科普公开课：了解大模型能做什么、如何用 AI 工具辅助学习与科研，并现场演示零代码搭建自己的智能助手。无需报名，直接到场参加即可。',
            highlights: ['无需报名，凭学生证直接入场', '时长约 90 分钟，含现场演示', '不限专业，建议提前 10 分钟到场', '前 300 名可获 AI 学习资料包'],
            forceEnded: false
        },
        {
            id: 'init-3',
            title: '大学生创新创业项目团队招募',
            category: 'project',
            icon: '🚀',
            location: '线上初筛 + 大学生活动中心 205 面试',
            startTime: '2026-09-23T19:00',
            endTime: null,
            timeText: '9月23日起组队开展，每周稳定推进',
            mode: 'signup',
            deadline: '2026-09-22T18:00',
            audience: '全校学生，开发 / 设计 / 材料方向均可',
            baseSignup: 97,
            desc: '校级大创项目正式招新！计划打造一款面向新生的校园服务小程序，现招募开发、UI 设计与文案材料成员。报名后需参加简短面试，请在报名信息中提交一段简短自我介绍。',
            highlights: ['招募开发、设计、材料三类成员', '每周需稳定投入 4 小时以上', '报名须提交一段简短自我介绍', '项目结题可获创新创业学分认定'],
            forceEnded: false
        },
        {
            id: 'init-4',
            title: '数学建模竞赛经验分享会',
            category: 'lecture',
            icon: '📐',
            location: '线上直播（回放将上传至学院 B 站号）',
            startTime: '2026-09-18T19:30',
            endTime: '2026-09-18T21:00',
            timeText: null,
            mode: 'direct',
            deadline: null,
            audience: '不限专业，对数模感兴趣的同学',
            baseSignup: 0,
            desc: '由国赛获奖团队主讲的数学建模经验分享会，内容涵盖参赛流程、选题策略、论文写作与队友分工。本场直播已结束，预计 9 月 20 日上传回放，可先收藏活动以便回看。',
            highlights: ['直播已结束，预计 9月20日 上传回放', '国赛一等奖团队亲述备赛经验', '不限专业，大一新生友好', '回放上线后可在本页查看更新'],
            forceEnded: true
        },
        {
            id: 'init-5',
            title: '校园公益志愿服务活动',
            category: 'volunteer',
            icon: '💚',
            location: '学校周边社区服务站（统一乘车前往）',
            startTime: '2026-09-27T08:30',
            endTime: '2026-09-27T17:00',
            timeText: null,
            mode: 'signup',
            deadline: '2026-09-20T12:00',
            audience: '全校学生，限报 50 人',
            baseSignup: 43,
            desc: '联合周边社区开展的公益志愿服务：帮助老年人学习使用智能手机、整理社区图书角并完成环境清洁。全天预计服务 8 小时，可录入志愿服务时长。报名成功后请于活动当天提前到场签到。',
            highlights: ['全天预计服务 8 小时，可录志愿时长', '名额 50 人，报满即止', '需于 8:30 前到场签到、统一出发', '提供午餐与往返交通'],
            forceEnded: false
        }
    ];

    /* ----------------------------------------------------------
     * 二、本地存储读写
     * -------------------------------------------------------- */

    const Storage = {
        readCustom() {
            try {
                const list = JSON.parse(localStorage.getItem(LS_CUSTOM));
                return Array.isArray(list) ? list : [];
            } catch (e) {
                return [];
            }
        },
        writeCustom(list) {
            localStorage.setItem(LS_CUSTOM, JSON.stringify(list));
        },
        readState() {
            try {
                const state = JSON.parse(localStorage.getItem(LS_STATE));
                return {
                    signups: (state && state.signups) || {},  // {活动id: 当前报名人数}
                    joined: (state && state.joined) || {}     // {活动id: true} 当前学生是否已报名
                };
            } catch (e) {
                return { signups: {}, joined: {} };
            }
        },
        writeState(state) {
            localStorage.setItem(LS_STATE, JSON.stringify(state));
        }
    };

    // 全局应用状态
    const state = {
        customActivities: Storage.readCustom(),
        signup: Storage.readState(),
        filterStatus: 'all',
        filterCategory: 'all',
        keyword: '',
        sort: 'deadline',
        currentDetailId: null
    };

    /* ----------------------------------------------------------
     * 三、工具函数
     * -------------------------------------------------------- */

    const $ = (selector) => document.querySelector(selector);

    function getAllActivities() {
        return INITIAL_ACTIVITIES.concat(state.customActivities);
    }

    // datetime-local 字符串 -> Date
    function toDate(iso) {
        return iso ? new Date(iso) : null;
    }

    // 小于 10 补零
    function pad(n) {
        return n < 10 ? '0' + n : '' + n;
    }

    // 格式化：2026-09-24T22:00 -> 9月24日(周四) 22:00
    function formatDateTime(iso, withWeek) {
        const d = toDate(iso);
        if (!d) return '';
        const weeks = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        let text = d.getMonth() + 1 + '月' + d.getDate() + '日';
        if (withWeek) text += '(' + weeks[d.getDay()] + ')';
        text += ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
        return text;
    }

    // 计算活动当前状态
    function getStatus(activity) {
        if (activity.forceEnded) return 'ended';
        const now = Date.now();

        if (activity.mode === 'direct') {
            const start = toDate(activity.startTime);
            // 免报名活动：活动开始时间过去后视为已结束
            return start && start.getTime() < now ? 'ended' : 'direct';
        }

        // 需要报名的活动：以报名截止时间判断
        const deadline = toDate(activity.deadline);
        return deadline && deadline.getTime() < now ? 'closed' : 'open';
    }

    // 获取报名人数（存储值优先，初始活动未存储时取 baseSignup）
    function getSignupCount(activity) {
        const stored = state.signup.signups[activity.id];
        if (typeof stored === 'number') return stored;
        return activity.baseSignup || 0;
    }

    function hasJoined(activityId) {
        return !!state.signup.joined[activityId];
    }

    // 倒计时文案：返回 {text, level}，level: urgent / normal / closed
    function getCountdown(activity, status) {
        const now = Date.now();

        if (status === 'open') {
            const diff = toDate(activity.deadline).getTime() - now;
            if (diff <= 0) return { text: '报名已截止', level: 'closed' };
            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            const urgent = diff < 24 * 3600000;
            let text;
            if (days >= 1) text = '距截止 ' + days + ' 天 ' + hours + ' 小时';
            else if (hours >= 1) text = '仅剩 ' + hours + ' 小时 ' + mins + ' 分截止';
            else text = '仅剩 ' + Math.max(mins, 1) + ' 分钟截止';
            return { text: text, level: urgent ? 'urgent' : 'normal' };
        }

        if (status === 'direct') {
            const start = toDate(activity.startTime);
            if (!start) return { text: '欢迎直接参加', level: 'normal' };
            const today = new Date();
            const sameDay = start.getFullYear() === today.getFullYear() &&
                            start.getMonth() === today.getMonth() &&
                            start.getDate() === today.getDate();
            if (sameDay) {
                return { text: '今天 ' + pad(start.getHours()) + ':' + pad(start.getMinutes()) + ' 开始', level: 'urgent' };
            }
            const days = Math.floor((start.getTime() - now) / 86400000);
            return { text: days >= 1 ? '距开始还有 ' + days + ' 天' : '即将开始', level: 'normal' };
        }

        if (status === 'closed') return { text: '报名已截止', level: 'closed' };
        return { text: '活动已结束', level: 'closed' };
    }

    // HTML 转义，防止用户输入破坏结构
    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // 简易 Toast
    let toastTimer = null;
    function showToast(message, type) {
        const toast = $('#toast');
        toast.textContent = message;
        toast.className = 'toast show' + (type ? ' toast-' + type : '');
        toast.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toast.className = 'toast';
            setTimeout(function () { toast.hidden = true; }, 250);
        }, 2400);
    }

    /* ----------------------------------------------------------
     * 四、筛选 / 搜索 / 排序
     * -------------------------------------------------------- */

    function statusMatches(statusKey, activityStatus) {
        if (statusKey === 'all') return true;
        // “已截止”页签下同时包含已截止与已结束
        if (statusKey === 'closed') return activityStatus === 'closed' || activityStatus === 'ended';
        return statusKey === activityStatus;
    }

    function getFilteredActivities() {
        const kw = state.keyword.trim().toLowerCase();
        let list = getAllActivities().filter(function (a) {
            const status = getStatus(a);
            if (!statusMatches(state.filterStatus, status)) return false;
            if (state.filterCategory !== 'all' && a.category !== state.filterCategory) return false;
            if (kw) {
                const haystack = [
                    a.title, a.location, a.desc, a.audience,
                    CATEGORIES[a.category].name
                ].concat(a.highlights || []).join(' ').toLowerCase();
                if (haystack.indexOf(kw) === -1) return false;
            }
            return true;
        });

        list.sort(function (a, b) {
            const sa = getStatus(a), sb = getStatus(b);

            if (state.sort === 'hot') {
                return getSignupCount(b) - getSignupCount(a);
            }
            if (state.sort === 'time') {
                const ta = toDate(a.startTime) ? toDate(a.startTime).getTime() : Infinity;
                const tb = toDate(b.startTime) ? toDate(b.startTime).getTime() : Infinity;
                return ta - tb;
            }
            // 默认：按紧迫程度（可报名按截止时间 -> 免报名按开始时间 -> 已截止/已结束）
            const rank = { open: 0, direct: 1, closed: 2, ended: 3 };
            if (rank[sa] !== rank[sb]) return rank[sa] - rank[sb];
            if (sa === 'open') {
                return toDate(a.deadline).getTime() - toDate(b.deadline).getTime();
            }
            if (sa === 'direct') {
                return toDate(a.startTime).getTime() - toDate(b.startTime).getTime();
            }
            return 0;
        });

        return list;
    }

    /* ----------------------------------------------------------
     * 五、渲染：统计、筛选器、卡片列表
     * -------------------------------------------------------- */

    function renderStats() {
        const all = getAllActivities();
        const openCount = all.filter(function (a) { return getStatus(a) === 'open'; }).length;
        const weekLater = Date.now() + 7 * 86400000;
        const upcoming = all.filter(function (a) {
            const t = toDate(a.startTime);
            const s = getStatus(a);
            return t && t.getTime() >= Date.now() && t.getTime() <= weekLater &&
                   (s === 'open' || s === 'direct');
        }).length;
        const totalSignup = all.reduce(function (sum, a) {
            return getStatus(a) === 'open' ? sum + getSignupCount(a) : sum;
        }, 0);

        const cards = [
            { num: all.length, label: '个活动正在展示' },
            { num: openCount, label: '个活动可报名' },
            { num: upcoming, label: '个本周即将开始' },
            { num: totalSignup, label: '人次已报名参与' }
        ];
        $('#heroStats').innerHTML = cards.map(function (c) {
            return '<div class="stat-card"><div class="stat-num">' + c.num +
                   '</div><div class="stat-label">' + c.label + '</div></div>';
        }).join('');
    }

    function renderFilters() {
        const all = getAllActivities();
        const countByStatus = function (predicate) {
            return all.filter(function (a) { return predicate(getStatus(a)); }).length;
        };
        const statusTabs = [
            { key: 'all', name: '全部', count: all.length },
            { key: 'open', name: '可报名', count: countByStatus(function (s) { return s === 'open'; }) },
            { key: 'direct', name: '免报名', count: countByStatus(function (s) { return s === 'direct'; }) },
            { key: 'closed', name: '已截止', count: countByStatus(function (s) { return s === 'closed' || s === 'ended'; }) }
        ];
        $('#statusFilter').innerHTML = statusTabs.map(function (t) {
            return '<button type="button" class="filter-btn' +
                   (state.filterStatus === t.key ? ' active' : '') +
                   '" data-status="' + t.key + '">' + t.name +
                   '<span class="count">' + t.count + '</span></button>';
        }).join('');

        // 分类：全部 + 四个内置分类
        const catTabs = [{ key: 'all', name: '全部分类', icon: '✨' }].concat(
            Object.keys(CATEGORIES).map(function (key) {
                return { key: key, name: CATEGORIES[key].name, icon: CATEGORIES[key].icon };
            })
        );
        $('#categoryFilter').innerHTML = catTabs.map(function (t) {
            const cls = t.key === 'all' ? '' : ' cat-' + t.key;
            return '<button type="button" class="cat-chip' + cls +
                   (state.filterCategory === t.key ? ' active' : '') +
                   '" data-category="' + t.key + '">' + t.icon + ' ' + t.name + '</button>';
        }).join('');
    }

    // 拼装一张活动卡片
    function buildCard(activity) {
        const status = getStatus(activity);
        const st = STATUS[status];
        const cat = CATEGORIES[activity.category];
        const countdown = getCountdown(activity, status);
        const joined = hasJoined(activity.id);
        const count = getSignupCount(activity.id);
        const closed = (status === 'closed' || status === 'ended');

        // 右上角徽章：状态 +（学生发布）+（已报名）
        let badges = '<span class="badge ' + st.cls + '">' + st.name + '</span>';
        if (activity.userCreated) badges += '<span class="badge badge-user">学生发布</span>';
        if (joined && status === 'open') badges += '<span class="badge badge-joined">✓ 已报名</span>';

        // 活动时间行
        const timeText = activity.timeText || formatDateTime(activity.startTime, true) +
            (activity.endTime ? ' - ' + pad(toDate(activity.endTime).getHours()) + ':' +
             pad(toDate(activity.endTime).getMinutes()) : '');

        // 标签
        const tags = (activity.highlights || []).slice(0, 2)
            .map(function (h) { return '<span class="tag">' + escapeHtml(h) + '</span>'; })
            .join('');

        // 底部操作按钮
        let actionBtn = '';
        if (status === 'open') {
            actionBtn = joined
                ? '<button type="button" class="btn-signup is-joined" data-action="toggle-signup" data-id="' + activity.id + '">取消报名</button>'
                : '<button type="button" class="btn-signup" data-action="toggle-signup" data-id="' + activity.id + '">立即报名</button>';
        } else if (status === 'direct') {
            actionBtn = '<button type="button" class="btn-signup btn-direct" data-action="direct" data-id="' + activity.id + '">直接参加</button>';
        } else {
            actionBtn = '<button type="button" class="btn-signup" disabled>' +
                       (status === 'ended' ? '已结束' : '已截止') + '</button>';
        }

        return '<article class="activity-card cat-' + activity.category + (closed ? ' is-closed' : '') + '">' +
            '<div class="card-cover">' +
                '<span class="card-badges">' + badges + '</span>' +
                '<span class="cover-icon" aria-hidden="true">' + (activity.icon || cat.icon) + '</span>' +
            '</div>' +
            '<div class="card-body">' +
                '<h3 class="card-title">' + escapeHtml(activity.title) + '</h3>' +
                '<ul class="card-meta">' +
                    '<li><span class="meta-icon">🕒</span><span>' + escapeHtml(timeText) + '</span></li>' +
                    '<li><span class="meta-icon">📍</span><span>' + escapeHtml(activity.location) + '</span></li>' +
                    '<li><span class="meta-icon">👥</span><span>' + escapeHtml(activity.audience || '全校学生') + '</span></li>' +
                '</ul>' +
                '<div class="card-tags">' + tags + '</div>' +
                '<div class="card-footer">' +
                    '<div class="signup-meta">' +
                        (activity.mode === 'signup'
                            ? '<span>🔥 ' + count + ' 人已报名</span>'
                            : '<span>🎟️ 免报名 · 欢迎到场</span>') +
                        '<span class="countdown ' +
                            (countdown.level === 'urgent' ? 'is-urgent' : countdown.level === 'closed' ? 'is-closed' : '') +
                        '">' + escapeHtml(countdown.text) + '</span>' +
                    '</div>' +
                    '<div class="card-actions">' +
                        '<button type="button" class="btn-detail" data-action="detail" data-id="' + activity.id + '">详情</button>' +
                        actionBtn +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</article>';
    }

    function renderGrid() {
        const list = getFilteredActivities();
        const grid = $('#activityGrid');
        grid.innerHTML = list.map(buildCard).join('');
        $('#emptyState').hidden = list.length !== 0;
        $('#resultCount').textContent = '共找到 ' + list.length + ' 个活动';
    }

    function renderAll() {
        renderStats();
        renderFilters();
        renderGrid();
    }

    /* ----------------------------------------------------------
     * 六、活动详情弹窗
     * -------------------------------------------------------- */

    function openDetail(activityId) {
        const activity = getAllActivities().find(function (a) { return a.id === activityId; });
        if (!activity) return;
        state.currentDetailId = activityId;

        const status = getStatus(activity);
        const st = STATUS[status];
        const cat = CATEGORIES[activity.category];
        const countdown = getCountdown(activity, status);

        const cover = $('#detailCover');
        cover.className = 'detail-cover cat-' + activity.category;
        $('#detailIcon').textContent = activity.icon || cat.icon;
        $('#detailBadge').className = 'badge ' + st.cls;
        $('#detailBadge').textContent = st.name;

        $('#detailTitle').textContent = activity.title;

        const timeText = activity.timeText || formatDateTime(activity.startTime, true) +
            (activity.endTime ? ' 至 ' + formatDateTime(activity.endTime, false) : '');

        const meta = [
            { label: '活动分类', value: cat.icon + ' ' + cat.name },
            { label: '面向对象', value: activity.audience || '全校学生' },
            { label: '活动时间', value: timeText, full: true },
            { label: '报名截止', value: activity.mode === 'signup' ? formatDateTime(activity.deadline, true) : '无需报名' },
            { label: '活动地点', value: activity.location },
            { label: '发布来源', value: activity.userCreated ? '学生自主发布' : '学校官方活动', full: true }
        ];
        $('#detailMeta').innerHTML = meta.map(function (m) {
            return '<li class="' + (m.full ? 'full' : '') + '"><span>' + m.label +
                   '：</span><strong>' + escapeHtml(m.value) + '</strong></li>';
        }).join('');

        $('#detailDesc').textContent = activity.desc;

        const highlightsWrap = $('#detailHighlightsWrap');
        if (activity.highlights && activity.highlights.length) {
            highlightsWrap.hidden = false;
            $('#detailHighlights').innerHTML = activity.highlights.map(function (h) {
                return '<li>' + escapeHtml(h) + '</li>';
            }).join('');
        } else {
            highlightsWrap.hidden = true;
        }

        // 底部报名区：注意——报名状态在每次打开/点击时实时读取，避免闭包快照过期
        renderDetailFooter(activity, status, countdown);

        showModal('detailModal');
    }

    function renderDetailFooter(activity, status, countdown) {
        status = status || getStatus(activity);
        countdown = countdown || getCountdown(activity, status);
        const joined = hasJoined(activity.id);
        const btn = $('#detailActionBtn');

        $('#detailSignupCount').textContent = activity.mode === 'signup'
            ? '🔥 ' + getSignupCount(activity) + ' 人已报名' + (joined ? '（你已报名）' : '')
            : '🎟️ 本活动无需报名';
        const cdEl = $('#detailCountdown');
        cdEl.textContent = countdown.text;
        cdEl.className = 'countdown ' +
            (countdown.level === 'urgent' ? 'is-urgent' : countdown.level === 'closed' ? 'is-closed' : '');

        btn.disabled = false;
        btn.classList.remove('is-joined', 'btn-direct');
        if (status === 'open') {
            if (joined) {
                btn.textContent = '取消报名';
                btn.classList.add('is-joined');
                btn.dataset.mode = 'cancel';
            } else {
                btn.textContent = '立即报名';
                btn.dataset.mode = 'signup';
            }
        } else if (status === 'direct') {
            btn.textContent = '我知道了，准时参加';
            btn.classList.add('btn-direct');
            btn.dataset.mode = 'direct';
        } else {
            btn.textContent = status === 'ended' ? '活动已结束' : '报名已截止';
            btn.disabled = true;
            btn.dataset.mode = 'none';
        }
    }

    /* ----------------------------------------------------------
     * 七、报名 / 取消报名（数据持久化到 localStorage）
     * -------------------------------------------------------- */

    function toggleSignup(activityId) {
        const activity = getAllActivities().find(function (a) { return a.id === activityId; });
        if (!activity) return;

        const status = getStatus(activity);
        if (status !== 'open') {
            showToast('该活动当前不在报名时段内', 'error');
            return;
        }

        const joined = hasJoined(activityId);
        const currentCount = getSignupCount(activity);

        if (joined) {
            // 取消报名
            state.signup.joined[activityId] = false;
            delete state.signup.joined[activityId];
            state.signup.signups[activityId] = Math.max(0, currentCount - 1);
            Storage.writeState(state.signup);
            showToast('已取消「' + activity.title + '」的报名', 'success');
        } else {
            // 确认报名：简单确认框，避免学生误触
            const ok = window.confirm('确认报名参加「' + activity.title + '」吗？\n报名后请按时参加，如需退出可随时取消。');
            if (!ok) return;
            state.signup.joined[activityId] = true;
            state.signup.signups[activityId] = currentCount + 1;
            Storage.writeState(state.signup);
            showToast('报名成功！可在活动卡片中查看状态 🎉', 'success');
        }

        renderAll();
        // 若详情弹窗正打开着，同步刷新底部按钮
        if (state.currentDetailId === activityId && !$('#detailModal').hidden) {
            renderDetailFooter(activity);
        }
    }

    function joinDirectActivity(activity) {
        showToast('「' + activity.title + '」无需报名，请按时间直接到场参加 🙌', 'success');
    }

    /* ----------------------------------------------------------
     * 八、发布活动（表单校验 + 持久化）
     * -------------------------------------------------------- */

    const form = $('#publishForm');

    function openPublishModal() {
        form.reset();
        clearFormErrors();
        toggleDeadlineRow();
        // 截止/开始时间输入框的最小值默认为当前时刻
        const nowStr = toLocalInputValue(new Date());
        ['fStartTime', 'fEndTime', 'fDeadline'].forEach(function (id) {
            $('#' + id).min = nowStr;
        });
        showModal('publishModal');
        setTimeout(function () { $('#fTitle').focus(); }, 200);
    }

    // Date -> datetime-local 需要的 YYYY-MM-DDTHH:mm
    function toLocalInputValue(d) {
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
               'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    function toggleDeadlineRow() {
        const mode = form.querySelector('input[name="signupMode"]:checked').value;
        $('#deadlineRow').style.display = mode === 'signup' ? '' : 'none';
    }

    function setFieldError(fieldId, message) {
        const field = $('#' + fieldId);
        const row = field.closest('.form-row');
        row.classList.add('has-error');
        row.querySelector('.field-error').textContent = message || '';
    }

    function clearFormErrors() {
        form.querySelectorAll('.form-row.has-error').forEach(function (row) {
            row.classList.remove('has-error');
        });
        form.querySelectorAll('.field-error').forEach(function (el) { el.textContent = ''; });
    }

    function validatePublishForm() {
        clearFormErrors();
        const errors = [];
        const title = $('#fTitle').value.trim();
        const category = $('#fCategory').value;
        const location = $('#fLocation').value.trim();
        const startTime = $('#fStartTime').value;
        const endTime = $('#fEndTime').value;
        const mode = form.querySelector('input[name="signupMode"]:checked').value;
        const deadline = $('#fDeadline').value;
        const audience = $('#fAudience').value.trim();
        const desc = $('#fDesc').value.trim();

        if (title.length < 4) {
            errors.push(['fTitle', '请输入至少 4 个字的活动名称']);
        }
        if (!category) {
            errors.push(['fCategory', '请选择活动分类']);
        }
        if (location.length < 2) {
            errors.push(['fLocation', '请填写活动地点']);
        }
        if (!startTime) {
            errors.push(['fStartTime', '请选择活动开始时间']);
        }
        if (startTime && new Date(startTime).getTime() < Date.now() - 60000) {
            errors.push(['fStartTime', '开始时间不能早于当前时间']);
        }
        if (endTime && startTime && new Date(endTime).getTime() <= new Date(startTime).getTime()) {
            errors.push(['fEndTime', '结束时间必须晚于开始时间']);
        }
        if (mode === 'signup') {
            if (!deadline) {
                errors.push(['fDeadline', '请选择报名截止时间']);
            } else if (new Date(deadline).getTime() < Date.now() - 60000) {
                errors.push(['fDeadline', '报名截止时间不能早于当前时间']);
            }
        }
        if (desc.length < 10) {
            errors.push(['fDesc', '请填写至少 10 个字的活动介绍（最多 300 字）']);
        }

        errors.forEach(function (pair) { setFieldError(pair[0], pair[1]); });
        return errors.length === 0;
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validatePublishForm()) {
            const firstError = form.querySelector('.form-row.has-error input, .form-row.has-error select, .form-row.has-error textarea');
            if (firstError) firstError.focus();
            showToast('请检查表单中标红的内容', 'error');
            return;
        }

        const mode = form.querySelector('input[name="signupMode"]:checked').value;
        const category = $('#fCategory').value;
        const activity = {
            id: 'user-' + Date.now(),
            title: $('#fTitle').value.trim(),
            category: category,
            icon: CATEGORIES[category].icon,
            location: $('#fLocation').value.trim(),
            startTime: $('#fStartTime').value || null,
            endTime: $('#fEndTime').value || null,
            timeText: null,
            mode: mode,
            deadline: mode === 'signup' ? $('#fDeadline').value : null,
            audience: $('#fAudience').value.trim() || '全校学生',
            baseSignup: 0,
            desc: $('#fDesc').value.trim(),
            highlights: [
                CATEGORIES[category].name + '类活动',
                mode === 'signup' ? '在线报名中，名额先到先得' : '免报名活动，欢迎到场',
                '由在校学生自主发布'
            ],
            forceEnded: false,
            userCreated: true
        };

        state.customActivities.unshift(activity);
        Storage.writeCustom(state.customActivities);

        // 发布后重置筛选，确保新活动立即可见
        state.filterStatus = 'all';
        state.filterCategory = 'all';
        state.keyword = '';
        $('#searchInput').value = '';
        $('#sortSelect').value = 'deadline';
        state.sort = 'deadline';

        hideModal('publishModal');
        renderAll();
        showToast('活动发布成功，已展示在活动大厅 🎉', 'success');

        // 滚动到新发布的卡片
        setTimeout(function () {
            const cards = document.querySelectorAll('.activity-card');
            if (cards.length) cards[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    });

    /* ----------------------------------------------------------
     * 九、弹窗通用控制
     * -------------------------------------------------------- */

    let lastFocused = null;
    function showModal(id) {
        lastFocused = document.activeElement;
        const modal = $('#' + id);
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
    }
    function hideModal(id) {
        $('#' + id).hidden = true;
        document.body.style.overflow = '';
        if (id === 'detailModal') state.currentDetailId = null;
        if (lastFocused) lastFocused.focus();
    }

    document.querySelectorAll('[data-close]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            hideModal(btn.getAttribute('data-close'));
        });
    });
    // 点击遮罩空白处关闭
    document.querySelectorAll('.modal-mask').forEach(function (mask) {
        mask.addEventListener('click', function (e) {
            if (e.target === mask) hideModal(mask.id);
        });
    });
    // Esc 关闭最上层弹窗
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (!$('#publishModal').hidden) hideModal('publishModal');
            else if (!$('#detailModal').hidden) hideModal('detailModal');
        }
    });

    /* ----------------------------------------------------------
     * 十、事件绑定
     * -------------------------------------------------------- */

    // 卡片区域事件委托：报名 / 取消 / 详情 / 直接参加
    $('#activityGrid').addEventListener('click', function (e) {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        const id = btn.dataset.id;

        if (action === 'detail') {
            openDetail(id);
        } else if (action === 'toggle-signup') {
            // 始终实时读取 localStorage 中的最新报名状态
            toggleSignup(id);
        } else if (action === 'direct') {
            const activity = getAllActivities().find(function (a) { return a.id === id; });
            if (activity) joinDirectActivity(activity);
        }
    });

    // 详情弹窗底部按钮
    $('#detailActionBtn').addEventListener('click', function () {
        if (!state.currentDetailId) return;
        const mode = this.dataset.mode;
        if (mode === 'signup' || mode === 'cancel') {
            toggleSignup(state.currentDetailId);
        } else if (mode === 'direct') {
            const activity = getAllActivities().find(function (a) { return a.id === state.currentDetailId; });
            hideModal('detailModal');
            if (activity) joinDirectActivity(activity);
        }
    });

    // 状态筛选
    $('#statusFilter').addEventListener('click', function (e) {
        const btn = e.target.closest('[data-status]');
        if (!btn) return;
        state.filterStatus = btn.dataset.status;
        renderFilters();
        renderGrid();
    });

    // 分类筛选
    $('#categoryFilter').addEventListener('click', function (e) {
        const btn = e.target.closest('[data-category]');
        if (!btn) return;
        state.filterCategory = btn.dataset.category;
        renderFilters();
        renderGrid();
    });

    // 搜索（输入即筛选）
    $('#searchInput').addEventListener('input', function (e) {
        state.keyword = e.target.value;
        renderGrid();
    });

    // 排序
    $('#sortSelect').addEventListener('change', function (e) {
        state.sort = e.target.value;
        renderGrid();
    });

    // 打开发布弹窗的所有入口按钮
    ['headerPublishBtn', 'heroPublishBtn', 'footerPublishBtn', 'emptyPublishBtn'].forEach(function (id) {
        $('#' + id).addEventListener('click', openPublishModal);
    });

    // 报名方式切换：免报名时隐藏截止时间
    form.querySelectorAll('input[name="signupMode"]').forEach(function (radio) {
        radio.addEventListener('change', toggleDeadlineRow);
    });

    // 恢复初始演示数据
    $('#resetBtn').addEventListener('click', function () {
        const ok = window.confirm('将清空你发布的活动与所有报名记录，恢复为 5 条初始演示数据，确定继续吗？');
        if (!ok) return;
        localStorage.removeItem(LS_CUSTOM);
        localStorage.removeItem(LS_STATE);
        state.customActivities = [];
        state.signup = { signups: {}, joined: {} };
        state.filterStatus = 'all';
        state.filterCategory = 'all';
        state.keyword = '';
        $('#searchInput').value = '';
        renderAll();
        showToast('已恢复初始演示数据', 'success');
    });

    /* ----------------------------------------------------------
     * 十一、启动
     * -------------------------------------------------------- */
    renderAll();
})();
