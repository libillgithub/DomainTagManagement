define(['echarts', 'highcharts', 'highcharts-more', 'd3','underscore'], function () {
    /*
    ***********************************************************************************************************************
    *Highcharts adapter
    ***********************************************************************************************************************
    */
	function _renderHighcharts (chartOpts, optionalParams) {
        var defaultOption = {
			title: {
				text: ''
			},
			credits: {
				enabled: false
			},
			tooltip: {
				// valueSuffix: ' customize'
				// pointFormat: '{series.name} produced <b>{point.y:,.0f}</b><br/>warheads in {point.x}'
			}
		}, 
		defaultPlotOptions = {
            area: {
                stacking: 'normal',
                lineColor: '#666666',
                lineWidth: 1,
                marker: {
                    lineWidth: 1,
                    lineColor: '#666666'
                }
            },
			areaspline: {
                fillOpacity: 0.5
            },
			pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                    style: {
                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                    }
                },
				slicedOffset : 20
				/*,showInLegend: true
                ,startAngle: -90,
                endAngle: 90,
                center: ['50%', '75%'] */
            },
			columnrange: {
                dataLabels: {
                    enabled: true,
                    formatter: function () {
                        return this.y;//+ '°C';
                    }
                }
            }
        };
	
        //deal with transforming between different charts
        function _preprocess(option, chartOpts) {
            var chartType = chartOpts.chartType || 'line',
                chartConfig = chartOpts.chartConfig || {}, yAxes = chartConfig.yAxes || [];
            
            //To handle the situation about that the chartConfig is null; 
            if (_.isEmpty(chartConfig)) {
                var chartData = chartOpts.chartData || {}, list = chartData.rows || [], temp = [], targetIndex = null;
                if (list.length > 0) {
                    temp = list[0];
                    for (var i = 0; i < temp.length; i++) {
                        if (Number(temp[i])) {
                            targetIndex = i;
                            break;
                        }
                    }
                    targetIndex = targetIndex || 0;
                    chartOpts.chartConfig = {'xAxes' : [], 'yAxes' : [targetIndex], 'series' : []};
                    yAxes = chartOpts.chartConfig.yAxes;
                } else {
                    chartOpts.chartConfig = {'xAxes' : [], 'yAxes' : [], 'series' : []};
                }
            }
            
            if (chartType === 'scatter' || chartType === 'bubble') {
                if (yAxes.length === 1) {
                    if (chartType === 'bubble') {
                        yAxes.push(yAxes[0], yAxes[0]);
                    } else {
                        yAxes.push(yAxes[0]);
                    }
                } else if (yAxes.length === 2 && chartType === 'bubble') {
                    yAxes.push(yAxes[1]);
                } else if (yAxes.length === 3 && chartType === 'scatter') {
                    yAxes.pop();
                }
            } else if (chartType === 'columnrange' || chartType === 'arearange') {
                if (yAxes.length === 1) {
                    yAxes.unshift('noneExist');
                } else if (yAxes.length === 3) {
                    yAxes.pop();
                }
            } else {
                if (yAxes.length > 1) {
                    chartConfig.yAxes = [yAxes[0]];
                }
            }
        }
        
        //get series, get xAxis's of series, get set of xAxis(Note: default xAsix and series's max number is one, yAsix's max number is three)
        function _prepareOption(option, chartOpts) {
            var chartType = chartOpts.chartType || 'line',
                chartData = chartOpts.chartData || {}, list = chartData.rows || [],
                chartConfig = chartOpts.chartConfig || {}, yAxes = chartConfig.yAxes || [],
                xAxes = chartConfig.xAxes || [], series = chartConfig.series || [], 
                seriesCol = series[0], withSeries = series.length > 0, seriesColVal = null, 
                xAxisCol = xAxes[0], withxAxis = xAxes.length > 0, xAxisColVal = null,
                
                existSeries = {}, seriesResult = [], seriesWithCatas = {},
                existCategories = {}, catagoriesResult = [], catagoriesObj = {}, //record all catagories.
                length = list.length || 0, i = 0, temp = {}, defaultValue = 0,
                xAxisType = withxAxis ? 'category' : 'linear'; //Other way: catagoriesResult.length > 0
                
            if (yAxes.length === 2) {
                defaultValue = [0, 0];
            } else if (yAxes.length === 3) {
                defaultValue = [0, 0, 0];
            }
            
            if (chartType === 'scatter' || chartType === 'bubble') { // scatter chart only have series and yAsex, xAsix can't work in this chart.
                withxAxis = false;
                xAxisType = 'linear';
            }
            
            for (; i < length; i++) {
                //Todo : check each column type
                temp = list[i];
                if (withSeries) {
                    seriesColVal = temp[seriesCol];
                    existSeries[seriesColVal] || seriesResult.push(seriesColVal);
                    existSeries[seriesColVal] = true;
                    
                    if (withxAxis) {
                        xAxisColVal = temp[xAxisCol];
                        existCategories[xAxisColVal] || (catagoriesResult.push(xAxisColVal) && (catagoriesObj[xAxisColVal] = defaultValue));
                        existCategories[xAxisColVal] = true;
                        /* if (seriesWithCatas[seriesColVal]) {
                            seriesWithCatas[seriesColVal].push(xAxisColVal);
                        } else {
                            seriesWithCatas[seriesColVal] = [xAxisColVal];
                        } */
                    }
                } else {
                    if (withxAxis) {
                        xAxisColVal = temp[xAxisCol];
                        existCategories[xAxisColVal] || (catagoriesResult.push(xAxisColVal) && (catagoriesObj[xAxisColVal] = defaultValue));
                        existCategories[xAxisColVal] = true;
                    }
                }
            }
            
            option.preparedOptions = {
                'seriesResult' : seriesResult,
                'catagoriesResult' : catagoriesResult,
                'catagoriesObj' : catagoriesObj,
                'seriesWithCatas' : seriesWithCatas,
                'xAxisType' : xAxisType,
                'withxAxis' : withxAxis,
                'withSeries' : withSeries
            };
        }
        
        function _addPlotOptions(option, chartOpts) {
            var chartType = chartOpts.chartType || 'line';
            option.plotOptions = {};
            defaultPlotOptions[chartType] && (option.plotOptions[chartType] = defaultPlotOptions[chartType]);
        }
        
        function _addxAxis(option, chartOpts) {
            var preOptions = option.preparedOptions, xAxis = {};
            
            if (preOptions.withxAxis) {
                xAxis.categories = preOptions.catagoriesResult;
            }
            xAxis.type = preOptions.xAxisType;
            option.xAxis = xAxis;
        }
        
        function _addyAxis(option, chartOpts) {
            option.yAxis = {
                title: {
                    text: 'customize' //customize
                }
            };
        }
        
        function _addSeries(option, chartOpts) { //Note: four situation about series and xAxis's combination
            var chartType = chartOpts.chartType || 'line', chartData = chartOpts.chartData || {}, rows = chartData.rows || [],
                chartConfig = chartOpts.chartConfig || {}, xAxisCol = chartConfig.xAxes[0], seriesCol = chartConfig.series[0], 
                yAxes = chartConfig.yAxes || [], optionSeries = [], preOptions = option.preparedOptions,
                seriesArray = preOptions.seriesResult, categories = preOptions.catagoriesResult;
            
            var aggregate = function (type, leftOper, rightOper) { //This is the default aggregate function for the yAsix value which has the same xAsix value.
                var result = rightOper;
                if (leftOper.length === undefined) {
                    result = leftOper + rightOper;
                } else if (leftOper.length === 2) {
                    result = [leftOper[0] + rightOper[0], leftOper[1] + rightOper[1]];
                } else if (leftOper.length === 3) {
                    result = [leftOper[0] + rightOper[0], leftOper[1] + rightOper[1], leftOper[2] + rightOper[2]];
                }
                return result;
            };
            
            if (preOptions.withSeries) {
                if (preOptions.withxAxis) { //WithSeries && With xAxis, 'result' include all the yAxis values that match the series value and xAxis value; (using aggregate defaultly)
                    optionSeries = _.map(seriesArray, function (value, index, listObj) {
                        var i = 0, length = rows.length, temp = {}, result = [], yAxisValue = null, existCatagories = {},
                            categoriesJson = $.extend({}, preOptions.catagoriesObj);
                        for (; i < length; i++) {
                            temp = rows[i];
                            if (temp[seriesCol] === value && (temp[xAxisCol] in categoriesJson)) {
                                if (yAxes.length === 1) {
                                    yAxisValue = Number(temp[yAxes[0]]) || 0;
                                } else if (yAxes.length === 2) {
                                    yAxisValue = [Number(temp[yAxes[0]]) || 0, Number(temp[yAxes[1]]) || 0];
                                } else {// if (yAxes.length === 3) 
                                    yAxisValue = [Number(temp[yAxes[0]]) || 0, Number(temp[yAxes[1]]) || 0, Number(temp[yAxes[2]]) || 0];
                                }
                                categoriesJson[temp[xAxisCol]] = existCatagories[temp[xAxisCol]] ? aggregate('sum', categoriesJson[temp[xAxisCol]], yAxisValue) : yAxisValue; // 这里可以做同一个x值对应的y值的聚合
                                existCatagories[temp[xAxisCol]] = true;
                            }
                        }
                        for (var key in categoriesJson) {//Note: be careful for the order of the json loop iteration.
                            if (chartType === 'pie') { //Note: use all series's catagories union set, not the each series owner catagories.
                                result.push([key, categoriesJson[key]]);
                            } else if (chartType === 'columnrange') {
                                result.push(categoriesJson[key] && categoriesJson[key].sort());
                            } else {
                                result.push(categoriesJson[key]);
                            }
                        }
                        
                        return {
                            name : value,
                            data : result
                        };
                    });
                } else {  //WithSeries && Without xAxis, 'result' include all the yAxis values that match the series value;
                    optionSeries = _.map(seriesArray, function (value, index, listObj) {
                        var i = 0, length = rows.length, temp = {}, result = [], yAxisValue = null;
                        for (; i < length; i++) {
                            temp = rows[i];
                            if (temp[seriesCol] === value) {
                                if (yAxes.length === 1) {
                                    yAxisValue = Number(temp[yAxes[0]]) || 0;
                                } else if (yAxes.length === 2) {
                                    yAxisValue = [Number(temp[yAxes[0]]) || 0, Number(temp[yAxes[1]]) || 0];
                                } else {// if (yAxes.length === 3) 
                                    yAxisValue = [Number(temp[yAxes[0]]) || 0, Number(temp[yAxes[1]]) || 0, Number(temp[yAxes[2]]) || 0];
                                }
                                if (chartType === 'pie') {
                                    result.push(['value' + i, yAxisValue]); //or result.push(yAxisValue);
                                } else if (chartType === 'columnrange') {
                                    result.push(yAxisValue && yAxisValue.sort());
                                } else {
                                    result.push(yAxisValue);
                                }
                            }
                        }
                        
                        return {
                            name : value,
                            data : result
                        };
                    });
                }
            } else {
                if (preOptions.withxAxis) { //WithoutSeries && With xAxis, 'result' include all the yAxis values that match xAxis value; (using aggregate defaultly)
                    var i = 0, length = rows.length, temp = {}, result = [], yAxisValue = null, existCatagories = {},
                        categoriesJson = $.extend({}, preOptions.catagoriesObj);
                    for (; i < length; i++) {
                        temp = rows[i];
                        if (temp[xAxisCol] in categoriesJson) {
                            if (yAxes.length === 1) {
                                yAxisValue = Number(temp[yAxes[0]]) || 0;
                            } else if (yAxes.length === 2) {
                                yAxisValue = [Number(temp[yAxes[0]]) || 0, Number(temp[yAxes[1]]) || 0];
                            } else {// if (yAxes.length === 3) 
                                yAxisValue = [Number(temp[yAxes[0]]) || 0, Number(temp[yAxes[1]]) || 0, Number(temp[yAxes[2]]) || 0];
                            }
                            categoriesJson[temp[xAxisCol]] = existCatagories[temp[xAxisCol]] ? aggregate('sum', categoriesJson[temp[xAxisCol]], yAxisValue) : yAxisValue; // 这里可以做同一个x值对应的y值的聚合
                            existCatagories[temp[xAxisCol]] = true;
                        }
                    }
                    for (var key in categoriesJson) { //Note: be careful for the order of the json loop iteration.
                        if (chartType === 'pie') {
                            result.push([key, categoriesJson[key]]);
                        } else if (chartType === 'columnrange') {
                            result.push(categoriesJson[key] && categoriesJson[key].sort());
                        } else {
                            result.push(categoriesJson[key]);
                        }
                    }
                    
                    optionSeries = [
                        {
                            name : 'none series',
                            data : result
                        }
                    ];
                } else {//WithoutSeries && Without xAxis, 'result' include all the yAxis values
                    var i = 0, length = rows.length, temp = {}, result = [], yAxisValue = null;
                    for (; i < length; i++) {
                        temp = rows[i];
                        if (yAxes.length === 1) {
                            yAxisValue = Number(temp[yAxes[0]]) || 0;
                        } else if (yAxes.length === 2) {
                            yAxisValue = [Number(temp[yAxes[0]]) || 0, Number(temp[yAxes[1]]) || 0];
                        } else {// if (yAxes.length === 3) 
                            yAxisValue = [Number(temp[yAxes[0]]) || 0, Number(temp[yAxes[1]]) || 0, Number(temp[yAxes[2]]) || 0];
                        }
                        if (chartType === 'pie') {
                            result.push(['value' + i, yAxisValue]); //or result.push(yAxisValue);
                        } else if (chartType === 'columnrange') {
                            result.push(yAxisValue && yAxisValue.sort());
                        } else {
                            result.push(yAxisValue);
                        }
                    }
                    
                    optionSeries = [
                        {
                            name : 'none series',
                            data : result
                        }
                    ];
                }
            }
            
            option.series = optionSeries;
        }
        
        function _generateOption(chartOpts) {
            var chartType = chartOpts.chartType || 'line';
            var option = $.extend(true, {}, defaultOption);
            option.chart = {type : chartType};
            chartOpts = $.extend(true, {}, chartOpts);
            
            _preprocess(option, chartOpts);
            _prepareOption(option, chartOpts);
            _addPlotOptions(option, chartOpts);
            if (chartType !== 'pie') {
                _addxAxis(option, chartOpts);
                _addyAxis(option, chartOpts);
            }
            _addSeries(option, chartOpts);
            return option;
        }
        
        function _renderChart(chartOpts, optionalParams) {
            var container = chartOpts.container, option = {};
                
            option = _generateOption(chartOpts);
            if (_.isObject(optionalParams) && !_.isEmpty(optionalParams)) {
                option = _.defaults({}, optionalParams, option);
            }
            console.dir(option);
            
            $('#' + container).highcharts(option);
        }
        
        //Invoking the chart rendered method.
        _renderChart(chartOpts, optionalParams);
    }
	
    /*
    ***********************************************************************************************************************
    *Echarts adapter
    ***********************************************************************************************************************
    */
    function _renderEcharts(chartOpts, optionalParams) {
        var coordinateCharts = /^line|spline|area|areaspline|bar|column|scatter|bubble|k$/;
        var defaultOption = {
            title : {
                text: '',
                subtext: ''
            },
            tooltip : {
                trigger: 'axis'
            },
            legend: {
                data: []
            },
            toolbox: {
                show : true,
                feature : {
                    mark : {show: true},
                    dataView : {show: true, readOnly: false},
                    magicType : {show: true, type: ['line', 'bar']},
                    restore : {show: true},
                    saveAsImage : {show: true}
                }
            },
            calculable : true
		}, 
		defaultPlotOptions = {
            pie: {
                title : {
                    x:'center'
                },
                tooltip : {
                    trigger: 'item',
                    formatter: "{a} <br/>{b} : {c} ({d}%)"
                },
                legend: {
                    orient : 'vertical',
                    x : 'left'
                },
                toolbox: {
                    show : true,
                    feature : {
                        mark : {show: true},
                        dataView : {show: true, readOnly: false},
                        magicType : {
                            show: true, 
                            type: ['pie', 'funnel'],
                            option: {
                                funnel: {
                                    x: '25%',
                                    width: '50%',
                                    funnelAlign: 'left',
                                    max: 1548
                                }
                            }
                        },
                        restore : {show: true},
                        saveAsImage : {show: true}
                    }
                }
            },
            bubble : {
                tooltip : {
                    trigger: 'axis',
                    showDelay : 0,
                    axisPointer:{
                        type : 'cross',
                        lineStyle: {
                            type : 'dashed',
                            width : 1
                        }
                    }
                },
                toolbox: {
                    show : true,
                    feature : {
                        mark : {show: true},
                        dataZoom : {show: true},
                        dataView : {show: true, readOnly: false},
                        restore : {show: true},
                        saveAsImage : {show: true}
                    }
                }
            }
        };
	
        //deal with transforming between different charts
        function _preprocess(option, chartOpts) {
            var chartType = chartOpts.chartType, chartConfig = chartOpts.chartConfig || {}, yAxes = chartConfig.yAxes || [];
            
            //To handle the situation about that the chartConfig is null; 
            if (_.isEmpty(chartConfig)) {
                var chartData = chartOpts.chartData, list = chartData.rows || [], temp = [], targetIndex = null;
                if (list.length > 0) {
                    temp = list[0];
                    for (var i = 0; i < temp.length; i++) {
                        if (Number(temp[i])) {
                            targetIndex = i;
                            break;
                        }
                    }
                    targetIndex = targetIndex || 0;
                    chartOpts.chartConfig = {'xAxes' : [], 'yAxes' : [targetIndex], 'series' : []};
                    yAxes = chartOpts.chartConfig.yAxes;
                } else {
                    chartOpts.chartConfig = {'xAxes' : [], 'yAxes' : [], 'series' : []};
                }
            }
            
            if (chartType === 'scatter' || chartType === 'bubble') {
                if (yAxes.length === 1) {
                    if (chartType === 'bubble') {
                        yAxes.push(yAxes[0], yAxes[0]);
                    } else {
                        yAxes.push(yAxes[0]);
                    }
                } else if (yAxes.length === 2 && chartType === 'bubble') {
                    yAxes.push(yAxes[1]);
                } else if (yAxes.length === 3 && chartType === 'scatter') {
                    yAxes.pop();
                }
            } else if (chartType === 'columnrange' || chartType === 'arearange') { // These two chart don't exist in echarts.
                if (yAxes.length === 1) {
                    yAxes.unshift('noneExist');
                } else if (yAxes.length === 3) {
                    yAxes.pop();
                }
            } else if (chartType === 'k') {
                var length = 4 - yAxes.length;
                var lastItem = yAxes[yAxes.length - 1];
                if (length > 0) {
                    for (var i = 0; i < length; i++) {
                        yAxes.push(lastItem);
                    }
                } else if (length < 0) {
                    length = yAxes.length - 4;
                    for (var i = 0; i < length; i++) {
                        yAxes.pop();
                    }
                }
            } else {
                if (yAxes.length > 1) {
                    chartConfig.yAxes = [yAxes[0]];
                }
            }
        }
        
        //get series, get xAxis's of series, get set of xAxis(Note: default xAsix and series's max number is one, yAsix's max number is three)
        function _prepareOption(option, chartOpts) {
            var chartType = chartOpts.chartType, chartData = chartOpts.chartData, chartConfig = chartOpts.chartConfig,
                xAxes = chartConfig.xAxes || [], yAxes = chartConfig.yAxes || [], series = chartConfig.series || [], 
                xAxisCol = xAxes[0], withxAxis = xAxes.length > 0, xAxisColVal = null,
                seriesCol = series[0], withSeries = series.length > 0, seriesColVal = null, 
                
                existSeries = {}, seriesArray = [], seriesWithCatas = {},
                existCategories = {}, catagoriesArray = [], catagoriesJSON = {}, //record all catagories.
                list = chartData.rows || [], length = list.length || 0, i = 0, temp = {}, defaultValue = 0,
                xAxisType = withxAxis ? 'category' : 'value'; //Other way: catagoriesArray.length > 0
                
            if (yAxes.length === 2) {
                defaultValue = [0, 0];
            } else if (yAxes.length === 3) {
                defaultValue = [0, 0, 0];
            } else if (yAxes.length === 4) {
                defaultValue = [0, 0, 0, 0];
            }
            
            if (chartType === 'scatter' || chartType === 'bubble') { // scatter chart only have series and yAsex, xAsix can't work in this chart.
                withxAxis = false;
                xAxisType = 'value';
            }
            
            for (; i < length; i++) {
                //Todo : check each column type
                temp = list[i];
                if (withSeries) {
                    seriesColVal = temp[seriesCol];
                    existSeries[seriesColVal] || seriesArray.push(seriesColVal);
                    existSeries[seriesColVal] = true;
                    
                    if (withxAxis) {
                        xAxisColVal = temp[xAxisCol];
                        existCategories[xAxisColVal] || (catagoriesArray.push(xAxisColVal) && (catagoriesJSON[xAxisColVal] = defaultValue));
                        existCategories[xAxisColVal] = true;
                        /* if (seriesWithCatas[seriesColVal]) {
                            seriesWithCatas[seriesColVal].push(xAxisColVal);
                        } else {
                            seriesWithCatas[seriesColVal] = [xAxisColVal];
                        } */
                    }
                } else {
                    if (withxAxis) {
                        xAxisColVal = temp[xAxisCol];
                        existCategories[xAxisColVal] || (catagoriesArray.push(xAxisColVal) && (catagoriesJSON[xAxisColVal] = defaultValue));
                        existCategories[xAxisColVal] = true;
                    }
                }
            }
            
            option.preparedOptions = {
                'seriesArray' : seriesArray,
                'catagoriesArray' : catagoriesArray,
                'catagoriesJSON' : catagoriesJSON,
                'seriesWithCatas' : seriesWithCatas,
                'xAxisType' : xAxisType,
                'withxAxis' : withxAxis,
                'withSeries' : withSeries
            };
        }
        
        function _addPlotOptions(option, chartOpts) {
            var chartType = chartOpts.chartType, preOptions = option.preparedOptions;
            defaultPlotOptions[chartType] && $.extend(true, option, defaultPlotOptions[chartType]);
            
            option.legend.data = (chartType === 'pie') ? preOptions.catagoriesArray : preOptions.seriesArray;
        }
        
        function _addxAxis(option, chartOpts) {
            var preOptions = option.preparedOptions, xAxis = [{}],
                boundaryGapRegExp = /[line|spline|area|areaspline]/;
            
            if (preOptions.withxAxis) {
                xAxis[0].data = preOptions.catagoriesArray;
            }
            xAxis[0].type = preOptions.xAxisType;
            // xAxis[0].boundaryGap = chartOpts.chartType === 'bar' ? [0, 0.01] : !boundaryGapRegExp.test(chartOpts.chartType);
            
            if (chartOpts.chartType === 'scatter' || chartOpts.chartType === 'bubble') {
                xAxis[0].scale = true;
            }
            option.xAxis = xAxis;
        }
        
        function _addyAxis(option, chartOpts) {
            option.yAxis = [
                {
                    type : 'value',
                    axisLabel : {
                        // formatter: '{value} °C'
                    }
                }
            ];
            
            if (chartOpts.chartType === 'scatter' || chartOpts.chartType === 'bubble') {
                option.yAxis[0].scale = true;
            }
            
            //exchange xAxis with yAsix
            if (chartOpts.chartType === 'bar') {
                var temp = option.yAxis;
                option.yAxis = option.xAxis;
                option.xAxis = temp;
            }
        }
        
        function _addSeries(option, chartOpts) { //Note: four situation about the series and xAxis's combination
            var chartType = chartOpts.chartType, chartData = chartOpts.chartData, chartConfig = chartOpts.chartConfig,
                xAxisCol = chartConfig.xAxes[0], seriesCol = chartConfig.series[0], yAxes = chartConfig.yAxes || [], 
                preOptions = option.preparedOptions, seriesArray = preOptions.seriesArray,
                rows = chartData.rows || [], optionSeries = [], seriesType = chartType, itemStyle = {normal : {}},
                smooth = false, symbolSize = 2;
            
            var aggregate = function (type, leftOper, rightOper) { //This is the default aggregate function for the yAsix value which has the same xAsix value.
                var result = rightOper;
                if (leftOper.length === undefined) {
                    result = leftOper + rightOper;
                } else if (leftOper.length === 2) {
                    result = [leftOper[0] + rightOper[0], leftOper[1] + rightOper[1]];
                } else if (leftOper.length === 3) {
                    result = [leftOper[0] + rightOper[0], leftOper[1] + rightOper[1], leftOper[2] + rightOper[2]];
                } else if (leftOper.length === 4) {
                    result = [leftOper[0] + rightOper[0], leftOper[1] + rightOper[1], leftOper[2] + rightOper[2], leftOper[3] + rightOper[3]];
                }
                return result;
            };
            
            if (seriesType === 'spline' || seriesType === 'area' || seriesType === 'areaspline') {
                if (seriesType !== 'spline') {
                    itemStyle = {normal: {areaStyle: {type: 'default'}}};
                } 
                if (seriesType.indexOf('spline') !== -1) {
                    smooth = true;
                }
                seriesType = 'line';
            } else if (seriesType === 'column') {
                seriesType = 'bar';
            } else if (seriesType === 'bubble') {
                seriesType = 'scatter';
                symbolSize = function (value){
                    return Math.round(value[2] / 300);
                };
            } else if (seriesType === 'scatter') {
                symbolSize = 4;
            }
            
            if (preOptions.withSeries) {
                if (preOptions.withxAxis) { //WithSeries && With xAxis, 'result' include all the yAxis values that match the series value and xAxis value; (using aggregate defaultly)
                    optionSeries = _.map(seriesArray, function (value, index, listObj) {
                        var i = 0, length = rows.length, temp = {}, result = [], yAxisValue = 0, existCatagories = {},
                            categoriesJson = $.extend({}, preOptions.catagoriesJSON);
                        for (; i < length; i++) {
                            temp = rows[i];
                            if (temp[seriesCol] === value && (temp[xAxisCol] in categoriesJson)) {
                                if (yAxes.length === 1) {
                                    yAxisValue = Number(temp[yAxes[0]]) || 0;
                                } else if (yAxes.length === 2) {
                                    yAxisValue = [Number(temp[yAxes[0]]) || 0, Number(temp[yAxes[1]]) || 0];
                                } else if (yAxes.length === 3) {
                                    yAxisValue = [Number(temp[yAxes[0]]) || 0, Number(temp[yAxes[1]]) || 0, Number(temp[yAxes[2]]) || 0];
                                } else if (yAxes.length === 4) {
                                    yAxisValue = [Number(temp[yAxes[0]]) || 0, Number(temp[yAxes[1]]) || 0, Number(temp[yAxes[2]]) || 0, Number(temp[yAxes[3]]) || 0];
                                }
                                categoriesJson[temp[xAxisCol]] = existCatagories[temp[xAxisCol]] ? aggregate('sum', categoriesJson[temp[xAxisCol]], yAxisValue) : yAxisValue; // 这里可以做同一个x值对应的y值的聚合
                                existCatagories[temp[xAxisCol]] = true;
                            }
                        }
                        for (var key in categoriesJson) {//Note: be careful for the order of the json loop iteration.
                            if (chartType === 'pie') { //Note: use all series's catagories union set, not the each series owner catagories.
                                result.push({value: categoriesJson[key], name: key});
                            } else if (chartType === 'columnrange') {
                                result.push(categoriesJson[key] && categoriesJson[key].sort());
                            } else {
                                result.push(categoriesJson[key]);
                            }
                        }
                        
                        return {
                            name : value,
                            type : seriesType,
                            smooth : smooth,
                            itemStyle : itemStyle,
                            symbolSize : symbolSize,
                            data : result
                        };
                    });
                } else {  //WithSeries && Without xAxis, 'result' include all the yAxis values that match the series value;
                    optionSeries = _.map(seriesArray, function (value, index, listObj) {
                        var i = 0, length = rows.length, temp = {}, result = [], yAxisValue = 0;
                        for (; i < length; i++) {
                            temp = rows[i];
                            if (temp[seriesCol] === value) {
                                if (yAxes.length === 1) {
                                    yAxisValue = Number(temp[yAxes[0]]) || 0;
                                } else if (yAxes.length === 2) {
                                    yAxisValue = [Number(temp[yAxes[0]]) || 0, Number(temp[yAxes[1]]) || 0];
                                } else if (yAxes.length === 3) {
                                    yAxisValue = [Number(temp[yAxes[0]]) || 0, Number(temp[yAxes[1]]) || 0, Number(temp[yAxes[2]]) || 0];
                                } else if (yAxes.length === 4) {
                                    yAxisValue = [Number(temp[yAxes[0]]) || 0, Number(temp[yAxes[1]]) || 0, Number(temp[yAxes[2]]) || 0, Number(temp[yAxes[3]]) || 0];
                                }
                                if (chartType === 'pie') {
                                    result.push({value: categoriesJson[key], name: key});
                                } else if (chartType === 'columnrange') {
                                    result.push(yAxisValue && yAxisValue.sort());
                                } else {
                                    result.push(yAxisValue);
                                }
                            }
                        }
                        
                        return {
                            name : value,
                            type : seriesType,
                            smooth : smooth,
                            itemStyle : itemStyle,
                            symbolSize : symbolSize,
                            data : result
                        };
                    });
                }
            } else {
                if (preOptions.withxAxis) { //WithoutSeries && With xAxis, 'result' include all the yAxis values that match xAxis value; (using aggregate defaultly)
                    var i = 0, length = rows.length, temp = {}, result = [], yAxisValue = 0, existCatagories = {},
                        categoriesJson = $.extend({}, preOptions.catagoriesJSON);
                    for (; i < length; i++) {
                        temp = rows[i];
                        if (temp[xAxisCol] in categoriesJson) {
                            if (yAxes.length === 1) {
                                yAxisValue = Number(temp[yAxes[0]]) || 0;
                            } else if (yAxes.length === 2) {
                                yAxisValue = [Number(temp[yAxes[0]]) || 0, Number(temp[yAxes[1]]) || 0];
                            } else if (yAxes.length === 3) {
                                yAxisValue = [Number(temp[yAxes[0]]) || 0, Number(temp[yAxes[1]]) || 0, Number(temp[yAxes[2]]) || 0];
                            } else if (yAxes.length === 4) {
                                yAxisValue = [Number(temp[yAxes[0]]) || 0, Number(temp[yAxes[1]]) || 0, Number(temp[yAxes[2]]) || 0, Number(temp[yAxes[3]]) || 0];
                            }
                            categoriesJson[temp[xAxisCol]] = existCatagories[temp[xAxisCol]] ? aggregate('sum', categoriesJson[temp[xAxisCol]], yAxisValue) : yAxisValue; // 这里可以做同一个x值对应的y值的聚合
                            existCatagories[temp[xAxisCol]] = true;
                        }
                    }
                    for (var key in categoriesJson) { //Note: be careful for the order of the json loop iteration.
                        if (chartType === 'pie') {
                            result.push({value: categoriesJson[key], name: key});
                        } else if (chartType === 'columnrange') {
                            result.push(categoriesJson[key] && categoriesJson[key].sort());
                        } else {
                            result.push(categoriesJson[key]);
                        }
                    }
                    
                    optionSeries = [
                        {
                            name : 'none series',
                            type : seriesType,
                            smooth : smooth,
                            itemStyle : itemStyle,
                            symbolSize : symbolSize,
                            data : result
                        }
                    ];
                } else {//WithoutSeries && Without xAxis, 'result' include all the yAxis values
                    var i = 0, length = rows.length, temp = {}, result = [], yAxisValue = 0;
                    for (; i < length; i++) {
                        temp = rows[i];
                        if (yAxes.length === 1) {
                            yAxisValue = Number(temp[yAxes[0]]) || 0;
                        } else if (yAxes.length === 2) {
                            yAxisValue = [Number(temp[yAxes[0]]) || 0, Number(temp[yAxes[1]]) || 0];
                        } else if (yAxes.length === 3) {
                            yAxisValue = [Number(temp[yAxes[0]]) || 0, Number(temp[yAxes[1]]) || 0, Number(temp[yAxes[2]]) || 0];
                        } else if (yAxes.length === 4) {
                            yAxisValue = [Number(temp[yAxes[0]]) || 0, Number(temp[yAxes[1]]) || 0, Number(temp[yAxes[2]]) || 0, Number(temp[yAxes[3]]) || 0];
                        }
                        if (chartType === 'pie') {
                            result.push({value: categoriesJson[key], name: key});
                        } else if (chartType === 'columnrange') {
                            result.push(yAxisValue && yAxisValue.sort());
                        } else {
                            result.push(yAxisValue);
                        }
                    }
                    
                    optionSeries = [
                        {
                            name : 'none series',
                            type : seriesType,
                            smooth : smooth,
                            itemStyle : itemStyle,
                            symbolSize : symbolSize,
                            data : result
                        }
                    ];
                }
            }
            
            option.series = optionSeries;
        }
        
        function _generateOption(chartOpts) {
            var option = $.extend(true, {}, defaultOption);
            chartOpts = $.extend(true, {}, chartOpts);
            chartOpts.chartType = chartOpts.chartType || 'line';
            chartOpts.chartData = chartOpts.chartData || {};
            
            //TODO:deal with the inexistent chartType 
            if (chartOpts.chartType === 'columnrange') {
                chartOpts.chartType = 'column';
            } else if (chartOpts.chartType === 'arearange') {
                chartOpts.chartType = 'area';
            }

            _preprocess(option, chartOpts);
            _prepareOption(option, chartOpts);
            _addPlotOptions(option, chartOpts);
            if (coordinateCharts.test(chartOpts.chartType)) {
                _addxAxis(option, chartOpts);
                _addyAxis(option, chartOpts);
            }
            _addSeries(option, chartOpts);
            return option;
        }
        
        function _renderChart(chartOpts, optionalParams) {
            var chart = echarts.init(document.getElementById(chartOpts.container)), option = {};
            
            option = _generateOption(chartOpts);
            if (_.isObject(optionalParams) && !_.isEmpty(optionalParams)) {
                option = $.extend(true, {}, option, optionalParams);
            }
            console.dir(option);
            chart.setOption(option, true); 
        }
        
        //Invoking the chart rendered method.
        _renderChart(chartOpts, optionalParams);
    }
    
    
    /*
    ***********************************************************************************************************************
    *D3 charts adapter
    ***********************************************************************************************************************
    */
    function _renderD3charts(chartOpts, optionalParams) {
        // From http://mkweb.bcgsc.ca/circos/guide/tables/
        var container = '#' + chartOpts.container;
        $(container).empty().removeData();
        
        if (chartOpts.chartType === 'bubble') {
            _bubble();
        } else {
            _chord();    
        }
        
        function _bubble() {
            var width = parseFloat($(container).css('width')) - 10,
                height = parseFloat($(container).css('height')) + 20,
                format = d3.format(",d"),
                color = d3.scale.category20c();

            var bubble = d3.layout.pack()
                .sort(null)
                .size([width, height])
                .padding(1.5);

            var svg = d3.select(container).append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("class", "bubble");

            d3.json("/script/common/flare.json", function(error, root) {
              var node = svg.selectAll(".node")
                  .data(bubble.nodes(classes(root))
                  .filter(function(d) { return !d.children; }))
                .enter().append("g")
                  .attr("class", "node")
                  .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

              node.append("title")
                  .text(function(d) { return d.className + ": " + format(d.value); });

              node.append("circle")
                  .attr("r", function(d) { return d.r; })
                  .style("fill", function(d) { return color(d.packageName); });

              node.append("text")
                  .attr("dy", ".3em")
                  .style("text-anchor", "middle")
                  .text(function(d) { return d.className.substring(0, d.r / 3); });
            });

            // Returns a flattened hierarchy containing all leaf nodes under the root.
            function classes(root) {
              var classes = [];

              function recurse(name, node) {
                if (node.children) node.children.forEach(function(child) { recurse(node.name, child); });
                else classes.push({packageName: name, className: node.name, value: node.size});
              }

              recurse(null, root);
              return {children: classes};
            }

            d3.select(self.frameElement).style("height", height + "px");
        }
        
        function _chord() {
            var matrix = [
              [11975,  5871, 8916, 2868],
              [ 1951, 10048, 2060, 6171],
              [ 8010, 16145, 8090, 8045],
              [ 1013,   990,  940, 6907]
            ];

            var chord = d3.layout.chord()
                .padding(.05)
                .sortSubgroups(d3.descending)
                .matrix(matrix);

            var width = parseFloat($(container).css('width')) - 10,
                height = parseFloat($(container).css('height')),
                innerRadius = Math.min(width, height) * .41,
                outerRadius = innerRadius * 1.1;

            var fill = d3.scale.ordinal()
                .domain(d3.range(4))
                .range(["#000000", "#FFDD89", "#957244", "#F26223"]);

            var svg = d3.select(container).append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

            svg.append("g").selectAll("path")
                .data(chord.groups)
              .enter().append("path")
                .style("fill", function(d) { return fill(d.index); })
                .style("stroke", function(d) { return fill(d.index); })
                .attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))
                .on("mouseover", fade(.1))
                .on("mouseout", fade(1));

            var ticks = svg.append("g").selectAll("g")
                .data(chord.groups)
              .enter().append("g").selectAll("g")
                .data(groupTicks)
              .enter().append("g")
                .attr("transform", function(d) {
                  return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                      + "translate(" + outerRadius + ",0)";
                });

            ticks.append("line")
                .attr("x1", 1)
                .attr("y1", 0)
                .attr("x2", 5)
                .attr("y2", 0)
                .style("stroke", "#000");

            ticks.append("text")
                .attr("x", 8)
                .attr("dy", ".35em")
                .attr("transform", function(d) { return d.angle > Math.PI ? "rotate(180)translate(-16)" : null; })
                .style("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
                .text(function(d) { return d.label; });

            svg.append("g")
                .attr("class", "chord")
              .selectAll("path")
                .data(chord.chords)
              .enter().append("path")
                .attr("d", d3.svg.chord().radius(innerRadius))
                .style("fill", function(d) { return fill(d.target.index); })
                .style("opacity", 1);

            // Returns an array of tick angles and labels, given a group.
            function groupTicks(d) {
              var k = (d.endAngle - d.startAngle) / d.value;
              return d3.range(0, d.value, 1000).map(function(v, i) {
                return {
                  angle: v * k + d.startAngle,
                  label: i % 5 ? null : v / 1000 + "k"
                };
              });
            }

            // Returns an event handler for fading a given chord group.
            function fade(opacity) {
              return function(g, i) {
                svg.selectAll(".chord path")
                    .filter(function(d) { return d.source.index != i && d.target.index != i; })
                  .transition()
                    .style("opacity", opacity);
              };
            }
        }
    }
    
    /*
    *gscharts' main function
    */
    function renderChart(chartOpts, optionalParams) {
        if (chartOpts.widgetType === 'echarts') {
            _renderEcharts(chartOpts, optionalParams);
        } else if (chartOpts.widgetType === 'd3') {
            _renderD3charts(chartOpts, optionalParams);
        } else { //highcharts
            _renderHighcharts(chartOpts, optionalParams);
        }
    }
    
	return {
		renderChart : renderChart
	};
});