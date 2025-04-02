document.addEventListener('DOMContentLoaded', function() {
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

    const monthYearElement = document.getElementById('month-year');
    const calendarBody = document.getElementById('calendar-body');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');

    // 添加事件监听器
    prevMonthButton.addEventListener('click', showPreviousMonth);
    nextMonthButton.addEventListener('click', showNextMonth);

    // 显示上个月
    function showPreviousMonth() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    }

    // 显示下个月
    function showNextMonth() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    }

    // 检查lunar库是否加载
    function isLunarLoaded() {
        return typeof Lunar !== 'undefined';
    }

    // 添加通用节假日生成功能
    const HolidayUtil = (function() {
        // 固定公历节日（每年相同日期）
        const FIXED_HOLIDAYS = {
            '01-01': { name: '元旦', type: 'fixed', important: true },
            '02-14': { name: '情人节', type: 'fixed', important: false },
            '03-08': { name: '妇女节', type: 'fixed', important: false },
            '03-12': { name: '植树节', type: 'fixed', important: false },
            '04-01': { name: '愚人节', type: 'fixed', important: false },
            '05-01': { name: '劳动节', type: 'fixed', important: true },
            '05-04': { name: '青年节', type: 'fixed', important: false },
            '06-01': { name: '儿童节', type: 'fixed', important: false },
            '07-01': { name: '建党节', type: 'fixed', important: false },
            '08-01': { name: '建军节', type: 'fixed', important: false },
            '09-10': { name: '教师节', type: 'fixed', important: false },
            '10-01': { name: '国庆节', type: 'fixed', important: true },
            '12-24': { name: '平安夜', type: 'fixed', important: false },
            '12-25': { name: '圣诞节', type: 'fixed', important: false }
        };
        
        // 法定节假日规则（这些节日由农历确定日期，但属于法定节假日）
        const LEGAL_LUNAR_HOLIDAYS = [
            { name: '春节', lunarMonth: 1, lunarDay: 1, daysBefore: 1, daysAfter: 2, important: true }, // 除夕+初一+初二+初三
            { name: '清明节', solarTerm: '清明', daysAfter: 2, important: true }, // 清明当天及后两天
            { name: '端午节', lunarMonth: 5, lunarDay: 5, daysAfter: 2, important: true }, // 端午及后两天
            { name: '中秋节', lunarMonth: 8, lunarDay: 15, daysAfter: 2, important: true }, // 中秋及后两天
            { name: '国庆节假期', month: 10, day: 2, daysAfter: 6, important: true } // 10月1日已在固定节日中，这里是额外的假期
        ];
        
        // 传统农历节日
        const TRADITIONAL_LUNAR_HOLIDAYS = [
            { name: '除夕', lunarMonth: 12, lunarDay: 29, lastDayOfYear: true, important: true }, // 特殊：如果农历12月小月，则为30日的前一天
            { name: '元宵节', lunarMonth: 1, lunarDay: 15, important: true },
            { name: '龙抬头', lunarMonth: 2, lunarDay: 2, important: false },
            { name: '七夕', lunarMonth: 7, lunarDay: 7, important: true },
            { name: '中元节', lunarMonth: 7, lunarDay: 15, important: false },
            { name: '重阳节', lunarMonth: 9, lunarDay: 9, important: true },
            { name: '腊八节', lunarMonth: 12, lunarDay: 8, important: false },
            { name: '小年', lunarMonth: 12, lunarDay: 23, important: false }
        ];
        
        // 计算除夕日期（农历十二月的最后一天）
        const calculateChineseNewYearEve = function(year) {
            if (typeof Lunar === 'undefined') {
                return null;
            }
            
            // 测试农历十二月是大月还是小月
            const nextYear = Lunar.fromYmd(year + 1, 1, 1); // 下一年正月初一
            const chineseNewYearEve = nextYear.getSolar();
            chineseNewYearEve.addDays(-1); // 减去一天就是除夕
            
            return chineseNewYearEve;
        };
        
        // 计算特定节气的日期
        const getSolarTermDate = function(year, solarTermName) {
            if (typeof Lunar === 'undefined') {
                return null;
            }
            
            try {
                const solarYear = Lunar.fromDate(new Date(year, 0, 1)).getSolar();
                const jieQiList = solarYear.getJieQiList();
                
                return jieQiList[solarTermName];
            } catch (e) {
                console.error(`获取节气 ${solarTermName} 日期出错:`, e);
                return null;
            }
        };
        
        // 为指定年份计算所有节假日
        const calculateHolidays = function(year) {
            const holidays = {};
            const yearStr = year.toString();
            
            // 添加固定公历节日
            Object.keys(FIXED_HOLIDAYS).forEach(dateKey => {
                const fullKey = `${yearStr}-${dateKey}`;
                holidays[fullKey] = FIXED_HOLIDAYS[dateKey];
            });
            
            // 如果Lunar库未加载，只返回固定公历节日
            if (typeof Lunar === 'undefined') {
                return holidays;
            }
            
            try {
                // 添加法定农历节假日
                LEGAL_LUNAR_HOLIDAYS.forEach(holiday => {
                    let baseDate;
                    
                    // 基于节气的假日（如清明节）
                    if (holiday.solarTerm) {
                        baseDate = getSolarTermDate(year, holiday.solarTerm);
                    }
                    // 基于农历日期的假日（如春节、端午、中秋）
                    else if (holiday.lunarMonth && holiday.lunarDay) {
                        const lunarDate = Lunar.fromYmd(year, holiday.lunarMonth, holiday.lunarDay);
                        baseDate = lunarDate.getSolar();
                    }
                    // 基于公历日期的假日
                    else if (holiday.month && holiday.day) {
                        baseDate = Solar.fromYmd(year, holiday.month, holiday.day);
                    }
                    
                    if (!baseDate) return;
                    
                    // 添加法定假日前几天
                    if (holiday.daysBefore) {
                        for (let i = 1; i <= holiday.daysBefore; i++) {
                            const beforeDate = baseDate.clone();
                            beforeDate.addDays(-i);
                            
                            const dateKey = `${yearStr}-${(beforeDate.getMonth()+1).toString().padStart(2, '0')}-${beforeDate.getDay().toString().padStart(2, '0')}`;
                            holidays[dateKey] = {
                                name: i === 1 && holiday.name === '春节' ? '除夕' : `${holiday.name}前${i}天`,
                                type: 'legal',
                                important: holiday.important
                            };
                        }
                    }
                    
                    // 添加法定假日当天
                    const baseDateKey = `${yearStr}-${(baseDate.getMonth()+1).toString().padStart(2, '0')}-${baseDate.getDay().toString().padStart(2, '0')}`;
                    holidays[baseDateKey] = {
                        name: holiday.name,
                        type: 'legal',
                        important: holiday.important
                    };
                    
                    // 添加法定假日后几天
                    if (holiday.daysAfter) {
                        for (let i = 1; i <= holiday.daysAfter; i++) {
                            const afterDate = baseDate.clone();
                            afterDate.addDays(i);
                            
                            const dateKey = `${yearStr}-${(afterDate.getMonth()+1).toString().padStart(2, '0')}-${afterDate.getDay().toString().padStart(2, '0')}`;
                            holidays[dateKey] = {
                                name: `${holiday.name}假期`,
                                type: 'legal',
                                important: holiday.important
                            };
                        }
                    }
                });
                
                // 添加传统农历节日
                TRADITIONAL_LUNAR_HOLIDAYS.forEach(holiday => {
                    let lunarDate;
                    
                    // 特殊处理除夕（农历最后一天）
                    if (holiday.lastDayOfYear) {
                        const chineseNewYearEve = calculateChineseNewYearEve(year);
                        if (chineseNewYearEve) {
                            const dateKey = `${yearStr}-${(chineseNewYearEve.getMonth()+1).toString().padStart(2, '0')}-${chineseNewYearEve.getDay().toString().padStart(2, '0')}`;
                            holidays[dateKey] = {
                                name: holiday.name,
                                type: 'lunar',
                                important: holiday.important
                            };
                        }
                    } else {
                        lunarDate = Lunar.fromYmd(year, holiday.lunarMonth, holiday.lunarDay);
                        const solarDate = lunarDate.getSolar();
                        
                        const dateKey = `${yearStr}-${(solarDate.getMonth()+1).toString().padStart(2, '0')}-${solarDate.getDay().toString().padStart(2, '0')}`;
                        holidays[dateKey] = {
                            name: holiday.name,
                            type: 'lunar',
                            important: holiday.important
                        };
                    }
                });
                
                // 添加24节气
                const solarYear = Lunar.fromDate(new Date(year, 0, 1)).getSolar();
                const jieQiList = solarYear.getJieQiList();
                
                for (let jieQiName in jieQiList) {
                    const date = jieQiList[jieQiName];
                    const dateKey = `${yearStr}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDay().toString().padStart(2, '0')}`;
                    
                    // 如果这一天已经有更重要的节日，就不覆盖
                    if (holidays[dateKey] && holidays[dateKey].important) {
                        continue;
                    }
                    
                    holidays[dateKey] = {
                        name: jieQiName,
                        type: 'solarTerm',
                        important: false
                    };
                }
                
            } catch (e) {
                console.error(`计算${year}年节假日出错:`, e);
            }
            
            return holidays;
        };
        
        return {
            calculateHolidays: calculateHolidays
        };
    })();

    // 全局假日缓存
    const holidayCache = {};

    // 获取节假日信息
    function getHoliday(year, month, day) {
        // 确保月份和日期是两位数
        const monthStr = (month + 1).toString().padStart(2, '0');
        const dayStr = day.toString().padStart(2, '0');
        const dateKey = `${year}-${monthStr}-${dayStr}`;
        
        // 如果当年节假日数据未加载，则加载
        if (!holidayCache[year]) {
            console.log(`加载${year}年节假日数据`);
            holidayCache[year] = HolidayUtil.calculateHolidays(year);
            console.log(`${year}年节假日数据:`, holidayCache[year]);
        }
        
        return holidayCache[year][dateKey];
    }

    // 渲染日历
    function renderCalendar() {
        // 清空日历内容
        calendarBody.innerHTML = '';
        
        // 更新标题
        const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
        monthYearElement.textContent = `${currentYear}年 ${monthNames[currentMonth]}`;
        
        // 获取当月第一天
        const firstDay = new Date(currentYear, currentMonth, 1);
        
        // 获取当月天数
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        // 获取当月第一天是星期几
        const firstDayIndex = firstDay.getDay();
        
        // 获取上个月的天数
        const prevDaysCount = new Date(currentYear, currentMonth, 0).getDate();
        
        // 计算总单元格数量 (最多6行 * 7天)
        const totalCells = 42;
        
        // 初始日期计数器
        let date = 1;
        let nextMonthDate = 1;

        // 预加载当年和相邻年份的节假日数据
        if (!holidayCache[currentYear]) {
            holidayCache[currentYear] = HolidayUtil.calculateHolidays(currentYear);
        }
        
        // 跨年的情况，如当前是12月，预加载下一年，或当前是1月，预加载上一年
        if (currentMonth === 11 && !holidayCache[currentYear + 1]) {
            holidayCache[currentYear + 1] = HolidayUtil.calculateHolidays(currentYear + 1);
        } else if (currentMonth === 0 && !holidayCache[currentYear - 1]) {
            holidayCache[currentYear - 1] = HolidayUtil.calculateHolidays(currentYear - 1);
        }

        // 打印当前年月信息
        console.log(`渲染日历: ${currentYear}年${currentMonth + 1}月`);
        
        // 检查 Lunar 库状态
        if (typeof Lunar !== 'undefined') {
            console.log('Lunar库已加载');
            // 测试农历转换
            try {
                const testDate = new Date(currentYear, currentMonth, 1);
                const testLunar = Lunar.fromDate(testDate);
                console.log('测试农历转换:', testLunar);
                console.log('农历月日:', testLunar.getMonthInChinese(), testLunar.getDayInChinese());
                // 测试公历到农历再到公历的转换
                const testSolar = testLunar.getSolar();
                console.log('农历转回公历:', testSolar);
            } catch (e) {
                console.error('农历转换测试失败:', e);
            }
        } else {
            console.warn('Lunar库未加载，节假日信息可能不完整');
        }

        // 创建日历表格的行和单元格
        for (let i = 0; i < 6; i++) {
            // 创建新行
            const row = document.createElement('tr');
            
            // 创建行中的7个单元格（一周七天）
            for (let j = 0; j < 7; j++) {
                const cell = document.createElement('td');
                
                if (i === 0 && j < firstDayIndex) {
                    // 上个月的日期
                    const prevDate = prevDaysCount - (firstDayIndex - j - 1);
                    
                    // 使用div包装日期以便于添加样式
                    const dateContainer = document.createElement('div');
                    dateContainer.classList.add('date-container');
                    
                    const solarDate = document.createElement('div');
                    solarDate.textContent = prevDate;
                    solarDate.classList.add('solar-date');
                    
                    dateContainer.appendChild(solarDate);
                    
                    // 添加上个月的农历信息
                    try {
                        if (typeof Lunar !== 'undefined') {
                            // 计算上个月的年份和月份
                            let prevMonth = currentMonth - 1;
                            let prevYear = currentYear;
                            if (prevMonth < 0) {
                                prevMonth = 11;
                                prevYear--;
                            }
                            
                            const lunarDate = Lunar.fromDate(new Date(prevYear, prevMonth, prevDate));
                            const lunarElement = document.createElement('div');
                            lunarElement.textContent = lunarDate.getDayInChinese();
                            lunarElement.classList.add('lunar-date');
                            
                            dateContainer.appendChild(lunarElement);
                        }
                    } catch (e) {
                        console.error('上个月农历转换错误:', e);
                    }
                    
                    cell.appendChild(dateContainer);
                    cell.classList.add('other-month');
                } else if (date > daysInMonth) {
                    // 下个月的日期
                    const dateContainer = document.createElement('div');
                    dateContainer.classList.add('date-container');
                    
                    const solarDate = document.createElement('div');
                    solarDate.textContent = nextMonthDate;
                    solarDate.classList.add('solar-date');
                    
                    dateContainer.appendChild(solarDate);
                    
                    // 添加下个月的农历信息
                    try {
                        if (typeof Lunar !== 'undefined') {
                            // 计算下个月的年份和月份
                            let nextMonth = currentMonth + 1;
                            let nextYear = currentYear;
                            if (nextMonth > 11) {
                                nextMonth = 0;
                                nextYear++;
                            }
                            
                            const lunarDate = Lunar.fromDate(new Date(nextYear, nextMonth, nextMonthDate));
                            const lunarElement = document.createElement('div');
                            lunarElement.textContent = lunarDate.getDayInChinese();
                            lunarElement.classList.add('lunar-date');
                            
                            dateContainer.appendChild(lunarElement);
                        }
                    } catch (e) {
                        console.error('下个月农历转换错误:', e);
                    }
                    
                    cell.appendChild(dateContainer);
                    cell.classList.add('other-month');
                    
                    nextMonthDate++;
                } else {
                    // 当前月份的日期
                    const dateContainer = document.createElement('div');
                    dateContainer.classList.add('date-container');
                    
                    // 创建公历日期元素
                    const solarDate = document.createElement('div');
                    solarDate.textContent = date;
                    solarDate.classList.add('solar-date');
                    
                    // 添加到容器
                    dateContainer.appendChild(solarDate);
                    
                    try {
                        // 获取农历信息
                        if (typeof Lunar !== 'undefined') {
                            const lunarDate = Lunar.fromDate(new Date(currentYear, currentMonth, date));
                            
                            // 创建农历日期元素
                            const lunarElement = document.createElement('div');
                            lunarElement.textContent = lunarDate.getDayInChinese();
                            lunarElement.classList.add('lunar-date');
                            
                            // 添加到容器
                            dateContainer.appendChild(lunarElement);
                        }
                        
                        // 检查是否为节假日
                        const holiday = getHoliday(currentYear, currentMonth, date);
                        if (holiday) {
                            console.log(`发现节假日: ${currentYear}-${currentMonth+1}-${date}`, holiday);
                            const holidayElement = document.createElement('div');
                            holidayElement.textContent = typeof holiday === 'string' ? holiday : holiday.name;
                            holidayElement.classList.add('holiday-date');
                            
                            // 根据不同类型的节日设置不同的样式
                            if (typeof holiday !== 'string' && holiday.type) {
                                holidayElement.classList.add(`${holiday.type}-holiday`);
                            }
                            
                            // 如果是重要节日，添加额外的样式
                            if (holiday.important) {
                                holidayElement.classList.add('important-holiday');
                                cell.classList.add('important-holiday-cell');
                            }
                            
                            dateContainer.appendChild(holidayElement);
                            cell.classList.add('holiday');
                        }
                    } catch (e) {
                        console.error('日期转换错误:', e);
                    }
                    
                    cell.appendChild(dateContainer);
                    
                    // 标记今天的日期
                    if (date === currentDate.getDate() && 
                        currentMonth === currentDate.getMonth() && 
                        currentYear === currentDate.getFullYear()) {
                        cell.classList.add('today');
                    }
                    
                    date++;
                }
                
                row.appendChild(cell);
            }
            
            calendarBody.appendChild(row);
            
            // 如果已经显示完当前月份的所有日期，就跳出循环
            if (date > daysInMonth) {
                break;
            }
        }
    }

    // 页面加载完成后渲染日历
    if (!isLunarLoaded()) {
        console.warn('农历库未加载，将只显示公历日期');
    }
    renderCalendar();

    // 添加简单的调试功能
    function showDebug(show) {
        const debugInfo = document.getElementById('debug-info');
        if (show) {
            debugInfo.style.display = 'block';
            let lunarInfo = '未加载';
            try {
                if (typeof Lunar !== 'undefined') {
                    const today = new Date();
                    const lunarDate = Lunar.fromDate(today);
                    lunarInfo = `已加载，今天的农历日期：${lunarDate.getYearInChinese()}年${lunarDate.getMonthInChinese()}月${lunarDate.getDayInChinese()}`;
                }
            } catch (e) {
                lunarInfo = `加载出错: ${e.message}`;
            }
            
            debugInfo.innerHTML = `
                <p>公历: ${currentYear}年${currentMonth + 1}月</p>
                <p>农历库状态: ${lunarInfo}</p>
                <button onclick="hideDebug()">关闭调试</button>
            `;
        } else {
            debugInfo.style.display = 'none';
        }
    }

    function hideDebug() {
        document.getElementById('debug-info').style.display = 'none';
    }

    // 添加键盘快捷键显示调试信息 (按D键)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'd' || e.key === 'D') {
            showDebug(true);
        }
    });
});
