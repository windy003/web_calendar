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

    // 在控制台中添加调试函数，以检查Lunar库的功能
    function testLunarLibrary() {
        console.log("===== 测试Lunar库功能 =====");
        
        try {
            if (typeof Lunar === 'undefined') {
                console.error("Lunar库未加载!");
                return false;
            }
            
            // 测试基本转换
            const now = new Date();
            console.log("当前日期:", now);
            
            const lunarDate = Lunar.fromDate(now);
            console.log("农历日期对象:", lunarDate);
            
            // 检查可用的方法
            console.log("Lunar对象方法:");
            for (let key in lunarDate) {
                if (typeof lunarDate[key] === 'function') {
                    console.log(` - ${key}`);
                }
            }
            
            // 检查农历节日
            const festivals = lunarDate.getFestivals();
            console.log("今天的农历节日:", festivals);
            
            // 测试阳历转农历再转回阳历
                        const solarDate = lunarDate.getSolar();
            console.log("转回阳历:", solarDate);
            
            // 测试明确的农历日期 - 春节测试
            const springFestival = Lunar.fromYmd(now.getFullYear(), 1, 1);
            console.log("农历正月初一:", springFestival);
            const sfSolar = springFestival.getSolar();
            console.log("春节公历日期:", sfSolar);
            console.log("春节公历日期字符串:", 
                `${sfSolar.getYear()}-${sfSolar.getMonth()}-${sfSolar.getDay()}`);
            
            return true;
        } catch (e) {
            console.error("测试Lunar库时出错:", e);
            console.error("错误堆栈:", e.stack);
            return false;
        }
    }

    // 完全重写节假日计算逻辑
    const HolidayUtil = (function() {
        // 创建直接访问Lunar库的节假日计算函数
        function getLunarFestival(date) {
            try {
                if (typeof Lunar === 'undefined') return null;
                
                const lunar = Lunar.fromDate(date);
                // 获取农历节日
                const festivals = lunar.getFestivals();
                if (festivals && festivals.length > 0) {
                    return {
                        name: festivals[0],
                        type: 'lunar',
                        important: true
                    };
                }
                
                // 检查节气
                const jieQi = lunar.getJieQi();
                if (jieQi) {
                    return {
                        name: jieQi,
                        type: 'solarTerm',
                        important: false
                    };
                }
            } catch (e) {
                console.error("获取农历节日出错:", e);
            }
            return null;
        }
        
        // 获取公历节日（直接硬编码一些重要节日）
        function getSolarFestival(date) {
            const month = date.getMonth() + 1; // 月份是0-11
            const day = date.getDate();
            
            const festivals = {
                "1-1": { name: "元旦", type: "fixed", important: true },
                "2-14": { name: "情人节", type: "fixed", important: false },
                "3-8": { name: "妇女节", type: "fixed", important: false },
                "4-1": { name: "愚人节", type: "fixed", important: false },
                "5-1": { name: "劳动节", type: "fixed", important: true },
                "6-1": { name: "儿童节", type: "fixed", important: false },
                "10-1": { name: "国庆节", type: "fixed", important: true },
                "10-2": { name: "国庆节", type: "fixed", important: true },
                "10-3": { name: "国庆节", type: "fixed", important: true },
                "12-25": { name: "圣诞节", type: "fixed", important: false }
            };
            
            const key = `${month}-${day}`;
            return festivals[key] || null;
        }
        
        // 获取当前日期的所有节假日信息
        function getHolidaysForDate(date) {
            // 先检查公历节日
            const solarFestival = getSolarFestival(date);
            if (solarFestival && solarFestival.important) {
                return solarFestival;
            }
            
            // 再检查农历节日
            const lunarFestival = getLunarFestival(date);
            if (lunarFestival && lunarFestival.important) {
                return lunarFestival;
            }
            
            // 如果都不是重要节日，返回第一个找到的
            return lunarFestival || solarFestival;
        }
        
        // 为指定年月计算所有日期的节假日
        function calculateHolidaysForMonth(year, month) {
            console.log(`计算节假日: ${year}年${month+1}月`);
            const result = {};
            
            // 获取当月天数
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            // 对每一天计算节假日
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const holiday = getHolidaysForDate(date);
                
                if (holiday) {
                    const key = `${year}-${String(month+1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    result[key] = holiday;
                    console.log(`找到节假日: ${key} - ${holiday.name}`);
                }
            }
            
            return result;
        }
        
        return {
            calculateHolidaysForMonth: calculateHolidaysForMonth,
            getHolidaysForDate: getHolidaysForDate
        };
    })();

    // 全局假日缓存
    const holidayCache = {};

    // 更新获取节假日的函数
    function getHoliday(year, month, day) {
        try {
            // 直接使用日期对象计算
            const date = new Date(year, month, day);
            return HolidayUtil.getHolidaysForDate(date);
        } catch (e) {
            console.error(`获取节假日信息出错 (${year}-${month+1}-${day}):`, e);
            return null;
        }
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

        // 页面加载时先测试Lunar库
        const lunarLibraryWorks = testLunarLibrary();
        console.log("Lunar库可用:", lunarLibraryWorks);
        
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
                            
                            // 直接尝试获取节日
                            const festivals = lunarDate.getFestivals();
                            if (festivals && festivals.length > 0) {
                                const holidayElement = document.createElement('div');
                                holidayElement.textContent = festivals[0];
                                holidayElement.classList.add('holiday-date', 'lunar-holiday');
                                dateContainer.appendChild(holidayElement);
                                cell.classList.add('holiday');
                                console.log(`${currentYear}-${currentMonth+1}-${date} 农历节日:`, festivals[0]);
                            }
                        }
                        
                        // 简化的节假日检查
                        const currentDate = new Date(currentYear, currentMonth, date);
                        const holiday = HolidayUtil.getHolidaysForDate(currentDate);
                        
                        // 如果有节假日且还没有添加过节日元素
                        if (holiday && !dateContainer.querySelector('.holiday-date')) {
                            const holidayElement = document.createElement('div');
                            holidayElement.textContent = holiday.name;
                            holidayElement.classList.add('holiday-date', `${holiday.type}-holiday`);
                            dateContainer.appendChild(holidayElement);
                            cell.classList.add('holiday');
                        }
                    } catch (e) {
                        console.error(`渲染日期 ${currentYear}-${currentMonth+1}-${date} 出错:`, e);
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

    // 添加一个初始化函数，在页面加载时运行
    function initCalendar() {
        console.log("初始化日历...");
        testLunarLibrary();
        renderCalendar();
    }

    // 页面加载后运行初始化
    initCalendar();

    // 添加点击月份标题事件，弹出日期选择器
    monthYearElement.addEventListener('click', showDatePicker);
    
    // 创建日期选择器函数
    function showDatePicker() {
        // 创建模态窗口
        const modal = document.createElement('div');
        modal.classList.add('date-picker-modal');
        
        // 创建日期选择器容器
        const pickerContainer = document.createElement('div');
        pickerContainer.classList.add('date-picker-container');
        
        // 创建标题
        const title = document.createElement('h3');
        title.textContent = '选择日期';
        pickerContainer.appendChild(title);
        
        // 创建年份选择器
        yearLabel = document.createElement('label');
        yearLabel.textContent = '年份：';
        yearSelect = document.createElement('select');
        
        // 添加年份选项（当前年份前后10年）
        const currentYear = new Date().getFullYear();
        for (let year = currentYear - 10; year <= currentYear + 10; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year + '年';
            if (year === currentYear) {
                option.selected = true;
            }
            yearSelect.appendChild(option);
        }
        
        yearLabel.appendChild(yearSelect);
        pickerContainer.appendChild(yearLabel);
        
        // 创建月份选择器
        const monthLabel = document.createElement('label');
        monthLabel.textContent = '月份：';
        const monthSelect = document.createElement('select');
        
        // 添加月份选项
        const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
        for (let i = 0; i < 12; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = monthNames[i];
            if (i === currentMonth) {
                option.selected = true;
            }
            monthSelect.appendChild(option);
        }
        
        monthLabel.appendChild(monthSelect);
        pickerContainer.appendChild(monthLabel);
        
        // 创建按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('picker-buttons');
        
        // 创建确认按钮
        const confirmButton = document.createElement('button');
        confirmButton.textContent = '确定';
        confirmButton.addEventListener('click', function() {
            // 使用新变量存储选择的值，而不是直接修改 currentYear 和 currentMonth
            const selectedYear = parseInt(yearSelect.value);
            const selectedMonth = parseInt(monthSelect.value);
            
            // 关闭模态窗口
            document.body.removeChild(modal);
            
            // 更新日历到选定的日期（通过函数调用而不是直接赋值）
            updateCalendarDate(selectedYear, selectedMonth);
        });
        
        buttonContainer.appendChild(confirmButton);
        
        // 创建取消按钮
        const cancelButton = document.createElement('button');
        cancelButton.textContent = '取消';
        cancelButton.addEventListener('click', function() {
            // 关闭模态窗口
            document.body.removeChild(modal);
        });
        
        buttonContainer.appendChild(cancelButton);
        pickerContainer.appendChild(buttonContainer);
        
        // 将选择器添加到模态窗口
        modal.appendChild(pickerContainer);
        
        // 点击模态窗口背景关闭
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // 将模态窗口添加到页面
        document.body.appendChild(modal);
    }

    // 添加一个新函数来更新日历日期
    function updateCalendarDate(year, month) {
        currentYear = year;
        currentMonth = month;
        renderCalendar();
    }
});
