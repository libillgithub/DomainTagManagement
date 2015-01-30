define(['gscharts', 'gsdata', 'underscore', 'datatables', 'dataTables-tableTools', 'DT_bootstrap'], function (gscharts, gsdata) {
	var _chartTypes = ['line', 'spline', 'bar', 'column', 'area', 'areaspline', 'pie', 'columnrange', 'arearange', 'scatter', 'bubble'];
	var _chartDetails = {
        'line' : {'title' : '标准折线图', 'description' : '普通折线图'}, 
        'spline' : {'title' : '标准曲线图', 'description' : '普通曲线图'},
        'bar' : {'title' : '标准条形图', 'description' : '柱状图的横纵坐标互换'}, 
        'column' : {'title' : '标准柱状图', 'description' : '基本柱状图'},
        'area' : {'title' : '标准面积图', 'description' : '填充样式，普通折线'}, 
        'areaspline' : {'title' : '标准面积图', 'description' : '填充样式，平滑曲线'},
        'columnrange' : {'title' : '柱状范围图', 'description' : '普通柱状范围图'}, 
        'arearange' : {'title' : '面积范围图', 'description' : '普通面积范围图'},
        'scatter' : {'title' : '标准散点图', 'description' : '普通散点图'}, 
        'bubble' : {'title' : '标准冒泡图', 'description' : '普通冒泡图'},
        'pie' : {'title' : '标准饼图', 'description' : '基本饼图'}
    };
    var _datatablesCfg = {
        'searching' : false,
        'aLengthMenu': [10, 20, 50],
        'iDisplayLength': 10,
        'sPaginationType': 'bootstrap',
        'oLanguage': {
            'sProcessing': '正在加载中......',
            'sLengthMenu': '每页显示 _MENU_ 条记录',
            'sZeroRecords': '查询不到相关数据！',
            'sEmptyTable': '表中无数据存在！',
            'sInfo': '当前显示 _START_ 到 _END_ 条，共 _TOTAL_ 条记录',
            'sInfoEmpty': '当前显示 0 到 0 条，共 0 条记录',
            'sInfoFiltered': '（已从 _MAX_ 条总记录中过滤）',
            'sSearch': '搜索：',
            'oPaginate': {
                'sFirst': '首页',
                'sPrevious': '上一页',
                'sNext': '下一页',
                'sLast': '末页'
            }
        }
    };
    
    /*
     ***********************************************************************************************************************
     *   Cutomize plot , as follow.
     ***********************************************************************************************************************
    */
    
	//To handle the situation about that the chartConfig is null; 
	function _preprocess(chartOpts) {
		if (!chartOpts.chartConfig || _.isEmpty(chartOpts.chartConfig)) {
			var chartData = chartOpts.chartData || {}, list = chartData.rows || [], targetIndex = 0;
			if (list.length > 0) {
				list = list[0];
				for (var i = 0; i < list.length; i++) {
					if (Number(list[i]) || Number(list[i]) === 0) {
						targetIndex = i;
						break;
					}
				}
				chartOpts.chartConfig = {'xAxes' : [], 'yAxes' : [targetIndex], 'series' : []};
			} else {
				chartOpts.chartConfig = {'xAxes' : [], 'yAxes' : [], 'series' : []};
			}
		}
	}
	
	function _generateDialog(chartOpts) {
        var chartData = chartOpts.chartData, chartConfig = chartOpts.chartConfig,
			columns = chartData.columns || [], i = 0, temp = null, tempTpl = '',
			columnTpls = [], xAxesTpls = [], yAxesTpls = [], seriesTpls = [], chartTypes = [];

        chartTypes = _.map(_chartTypes, function (value, index, list) {
			var selectedTpl = (value === chartOpts.chartType) ? 'selected="selected"' : ''; 
			return '<option ' + selectedTpl + '>' + value + '</option>';
		});
		for (; i < columns.length; i++) {
			columnTpls.push('<h5 class="customize-plot-field" index="' + i + '">' + columns[i] + '</h5>');
		}
		for (i = 0; i < chartConfig.xAxes.length; i++) {
			temp = chartConfig.xAxes[i];
			tempTpl = '<h5 class="droppable-item"><span class="droppable-item-content" index="' + temp + '" order="'+ i + '">' + columns[temp] + '</span><button type="button" class="close"></button></h5>';
			xAxesTpls.push(tempTpl);
		}
		for (i = 0; i < chartConfig.yAxes.length; i++) {
			temp = chartConfig.yAxes[i];
			tempTpl = '<h5 class="droppable-item"><span class="droppable-item-content" index="' + temp + '" order="'+ i + '">' + columns[temp] + '</span><button type="button" class="close"></button></h5>';
			yAxesTpls.push(tempTpl);
		}
		for (i = 0; i < chartConfig.series.length; i++) {
			temp = chartConfig.series[i];
			tempTpl = '<h5 class="droppable-item"><span class="droppable-item-content" index="' + temp + '" order="'+ i + '">' + columns[temp] + '</span><button type="button" class="close"></button></h5>';
			seriesTpls.push(tempTpl);
		}

		var tpl = [
			'<div class="modal fade customize-plot" id="gscharts-customize-plot" tabindex="-1" role="basic" aria-hidden="true">                          ',
			'	<div class="modal-dialog modal-lg">                                                                                                     ',
			'		<div class="modal-content">                                                                                                         ',
			'			<div class="modal-header">                                                                                                      ',
			'				<button type="button" class="close" data-dismiss="modal" aria-hidden="true"></button>                                       ',
			'				<h4 class="modal-title">定制图表</h4>                                                                                       ',
			'			</div>                                                                                                                          ',
			'			<div class="modal-body">                                                                                                        ',
			'				<div class="row">                                                                                                           ',
			'					<div class="col-md-6 col-sm-12">                                                                                        ',
			'						<div class="row">                                                                                                   ',
			'							<div class="col-md-6 col-sm-12">                                                                                ',
			'								<h4>选择列：</h4><div class="customize-plot-item customize-plot-fields">' + columnTpls.join('') + '</div>   ',
			'							</div>                                                                                                          ',
			'							<div class="col-md-6 col-sm-12 customize-plot-draggableZone">                                                                                ',
			'								<h4>x轴：</h4><div maxLimit="1" class="customize-plot-item customize-plot-xAxes">' + xAxesTpls.join('') + '</div>',
			'								<h4>y轴：</h4><div maxLimit="3" class="customize-plot-item customize-plot-yAxes">' + yAxesTpls.join('') + '</div>',                                            
			'								<h4>系列：</h4><div maxLimit="1" class="customize-plot-item customize-plot-series">' + seriesTpls.join('') + '</div>',                                              
			'							</div>                                                                                                          ',
			'						</div>                                                                                                              ',
			'					</div>                                                                                                                  ',
			'					<div class="col-md-6 col-sm-12">                                                                                        ',
			'						<div class="customize-plot-chart" id="gschart-customizePlotChart"></div>                                            ',
			'					</div>                                                                                                                  ',
			'				</div>                                                                                                                      ',
			'				<div class="row" style="margin-top: 10px;">                                                                                                           ',
			'					<div class="col-md-6 col-sm-12">                                                                                        ',
			'						<h4 style="width: 20%; display: inline-block;">报表类型：</h4>                                                      ',
			'						<select id="customize-plot-charttype" class="form-control" style="width: 79.25%; display: inline-block;">           ',
										chartTypes.join(''),
			'						</select>  																											',                                                                               
			'					</div>                                                                                                                  ',
			'					<div class="col-md-6 col-sm-12"></div>                                                                                  ',
			'				</div>                                                                                                                      ',
			'			</div>                                                                                                                          ',
			'			<div class="modal-footer" style="margin-top:0;">                                                                                ',
			'				<button id="modalSaveBtn" type="button" class="btn blue" data-dismiss="modal">保存</button>                                                ',
			'				<button type="button" class="btn default" data-dismiss="modal">关闭</button>                                                ',
			'			</div>                                                                                                                          ',
			'		</div>                                                                                                                              ',
			'	</div>                                                                                                                                  ',
			'</div>                                                                                                                                     '
		].join('');
        
        var $customizeModal = $('#gscharts-customize-modal');
        if ($customizeModal.length === 0) {
            // var chartId = '#' + chartOpts.container;
            // chartId = chartId.replace('gswidget_content_', '');
            // $(chartId).parent().append('<div id="gscharts-customize-modal"></div>');
            // $customizeModal = $('#gscharts-customize-modal');
            
            $(document.body).append('<div id="gscharts-customize-modal"></div>');
            $customizeModal = $('#gscharts-customize-modal');
        }
        $customizeModal.empty().removeData();
		$customizeModal.append(tpl);
	}

	function _activeInteractions(chartOpts, optionalParams, extendedOpts) { //options
		var chartConfig = chartOpts.chartConfig;
		var $customizePlot = $('#gscharts-customize-plot');
		
		$('#modalSaveBtn', $customizePlot).on('click', function (e) {
			extendedOpts.callback && extendedOpts.callback(chartOpts, optionalParams);
		});
		
		$('#customize-plot-charttype', $customizePlot).on('change', function (e) {
			var $this = $(this);
			chartOpts.chartType = $this.val();
			gscharts.renderChart(chartOpts, optionalParams);
		});
		
		//The listener which is listening to remove exist draggableZone items
		$('.customize-plot-draggableZone', $customizePlot).on('click', '.close', function (e) {
			var $this = $(this), $removeItem = $this.prev(), $container = $this.closest('.customize-plot-item'),
				order = $removeItem.attr('order');
			$this.closest('h5').remove();
			
			if ($container.hasClass('customize-plot-xAxes')) {
				chartConfig.xAxes.splice(order);
			} else if ($container.hasClass('customize-plot-yAxes')) {
				chartConfig.yAxes.splice(order);
			} else { //customize-plot-series
				chartConfig.series.splice(order);
			}
			gscharts.renderChart(chartOpts, optionalParams);
		});
		
		//active draggable and droppable Interactions
		$('.customize-plot-fields .customize-plot-field', $customizePlot).draggable({
			appendTo : '#gscharts-customize-plot',
			helper : 'clone'
			// ,stop: function( event, ui ) {}
		});
		$('.customize-plot-xAxes, .customize-plot-yAxes, .customize-plot-series', $customizePlot).droppable({
			activeClass: 'ui-state-default',
			hoverClass: 'ui-state-hover',
			accept: ':not(.ui-sortable-helper)',
			drop: function (event, ui) {
				var index = ui.draggable.attr('index'), text = ui.draggable.text(),
					maxLimit = this.getAttribute('maxLimit'), $this = $(this), $previousNode = null;
					length = this.children.length, tpl = '';
				
				if (this.children.length < maxLimit) {
					$this.find('.placeholder').remove();
					tpl = '<h5 class="droppable-item"><span class="droppable-item-content" index="' + index + '" order="'+ length + '">' + text + '</span><button type="button" class="close"></button></h5>';
					$(tpl).appendTo(this);
					
					if ($this.hasClass('customize-plot-xAxes')) {
						chartConfig.xAxes.push(index);
					} else if ($this.hasClass('customize-plot-yAxes')) {
						chartConfig.yAxes.push(index);
					} else { //customize-plot-series
						chartConfig.series.push(index);
					}
					gscharts.renderChart(chartOpts, optionalParams);
				} else {
					$previousNode = $this.prev();
					if ($previousNode.find('.alert-warning').length <= 0) {
						tpl = [
							'<div class="alert alert-warning alert-dismissible" role="alert">',
							'	<strong>注意：</strong> 限制数目为' + maxLimit,
							'	<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>  ',
							'</div>'
						].join('');
						$previousNode.append(tpl);
						setTimeout(function () {
							$previousNode.find('.alert-warning').remove();
						}, 1000);
					}
				}
			}
		}).sortable({
            items: 'h5:not(.placeholder)',
            sort: function() {
                // gets added unintentionally by droppable interacting with sortable
                // using connectWithSortable fixes this, but doesn't allow you to customize active/hoverClass options
                $(this).removeClass( 'ui-state-default' );
            }
		});
	}
	
	function _customizePlot(chartOpts, optionalParams, extendedOpts) {
		chartOpts = $.extend(true, {}, chartOpts);
		optionalParams = optionalParams || {};
        extendedOpts = extendedOpts || {};
        
		_preprocess(chartOpts);
		_generateDialog(chartOpts);
        
		//Note: The modal method is asynchronous mode. It should use the event "shown.bs.modal" listener to monitor. 
		//Because highcharts can't get the size of container before modal have been shown.			
		$('#gscharts-customize-plot').modal('show').off('shown.bs.modal').on('shown.bs.modal', function (e) {
			_activeInteractions(chartOpts, optionalParams, extendedOpts);
            chartOpts.container = 'gschart-customizePlotChart';
            gscharts.renderChart(chartOpts, optionalParams);
		});
	}
    
    /*
     ***********************************************************************************************************************
     *   Render extended chart , as follow.
     ***********************************************************************************************************************
    */
    function _generateTabTpl(widgetType) {
        var chartTypes = _chartTypes, chartDetails = _chartDetails,
            tab_lis = [], nav_panes = [], content_tpl = '';
        
        if (widgetType === 'd3') {
            chartTypes = ['chord', 'bubble'];
            chartDetails = {
                'chord' : {'title' : '标准和弦图', 'description' : '基本和弦图'},
                'bubble' : {'title' : '标准冒泡图', 'description' : '基本冒泡图'}
            };    
        }
        
        tab_lis = _.map(chartTypes, function (value, index, list) {
            var activeCls = (index === 0) ? 'active' : '';
			return '<li class="' + activeCls + '"><a href="#tab_widgetType_' + value + '" data-toggle="tab">'+ value + '</a></li>';
		});
        nav_panes = _.map(chartTypes, function (value, index, list) {
            var activeCls = (index === 0) ? 'active' : '',
                chartDetail = chartDetails[value] || {'title' : '', 'description' : ''};
			return [
                '<div class="tab-pane fade ' + activeCls + ' in" id="tab_widgetType_'+ value + '">',
                    '<div class="tab-pane-content row">',
                        '<div class="tab-pane-content-item col-md-4 col-sm-7" chartType="widgetType-'+ value + '">',
                            ' <a href="javascript:void(0);" class="thumbnail">',
                                ' <img src="/script/common/img/chart-types/widgetType-'+ value + '.png">',
                                ' <h3>' + chartDetail.title + '</h3><em>' + chartDetail.description + '</em>',
                            ' </a>',
                        '</div>',
                    '</div>',
                '</div>'
            ].join('');
		});
        content_tpl = [
            ' <div class="tabbable tabs-left">                             ',
            '     <ul class="nav nav-tabs">                                ',
                    tab_lis.join(''),
            '     </ul>                                                    ',
            '     <div class="tab-content">                                ',
                    nav_panes.join(''),
            '     </div>                                                   ',
            ' </div>                                                       '
        ].join('');
     
        return content_tpl.replace(/widgetType/g, widgetType);
    }
    
    function _chooseChart(chartOpts, optionalParams, extendedOpts) {
        extendedOpts = extendedOpts || {};
        var title = extendedOpts.title || '切换图表';
        var tpl = [
			'<div class="modal fade customize-plot" id="gscharts-customize-chart" tabindex="-1" role="basic" aria-hidden="true"> ',
			'	<div class="modal-dialog modal-lg">                                                                              ',
			'		<div class="modal-content">                                                                                  ',
			'			<div class="modal-header">                                                                               ',
			'				<button type="button" class="close" data-dismiss="modal" aria-hidden="true"></button>                ',
			'				<h4 class="modal-title">' + title + '</h4>                                                           ',
			'			</div>                                                                                                   ',
			'			<div class="modal-body modal-body-chart">                                                                                 ',
			'				<div class="row portlet-tabs ">                                                                                    ',
            '                    <ul class="nav nav-tabs">                                 ',
            '                        <li class="">                                   ',
            '                            <a href="#tab_d3" data-toggle="tab">d3</a>     ',
            '                        </li>                                                 ',
            '                        <li class="">                                         ',
            '                            <a href="#tab_echarts" data-toggle="tab">echarts</a>  ',
            '                        </li>                                                 ',
            '                        <li class="active">                                         ',
            '                            <a href="#tab_highcharts" data-toggle="tab">highcharts</a>  ',
            '                        </li>                                                 ',
            '                    </ul>                                                     ',
            '                    <div class="tab-content tab-total-content">                                 ',
            '                        <div class="tab-pane fade active in" id="tab_highcharts">    ',
                                        _generateTabTpl('highcharts'),
            '                        </div>                                                ',
            '                        <div class="tab-pane fade" id="tab_echarts">              ',
                                        _generateTabTpl('echarts'),
            '                        </div>                                                ',
            '                        <div class="tab-pane fade" id="tab_d3">              ',
                                        _generateTabTpl('d3'),
            '                        </div>                                                ',
            '                    </div>                                                    ',
			'				</div>                                                                                        ',
			'			</div>                                                                                            ',
			'			<div class="modal-footer" style="margin-top:0;">                                                  ',
			'				<button id="modalSaveBtn" type="button" class="btn blue" data-dismiss="modal">保存</button>   ',
			'				<button type="button" class="btn default" data-dismiss="modal">关闭</button>                  ',
			'			</div>                                                                                            ',
			'		</div>                                                                                                ',
			'	</div>                                                                                                    ',
			'</div>                                                                                                       '
		].join('');
        
        var $customizeModal = $('#gscharts-customize-modal');
        if ($customizeModal.length === 0) {
            $(document.body).append('<div id="gscharts-customize-modal"></div>');
            $customizeModal = $('#gscharts-customize-modal');
        }
        $customizeModal.empty().removeData();
		$customizeModal.append(tpl);
        
        //Note: The modal method is asynchronous mode. It should use the event "shown.bs.modal" listener to monitor. 
		//Because highcharts can't get the size of container before modal have been shown.			
		$('#gscharts-customize-chart').modal('show').off('shown.bs.modal').on('shown.bs.modal', function (e) {
            var $customizeChart = $('#gscharts-customize-chart');
            $('.tab-total-content', $customizeChart).on('click', '.tab-pane-content-item', function (e) {
                $customizeChart.attr('selectedChartType', $(this).attr('chartType'));
            });
            $('#modalSaveBtn', $customizeChart).on('click', function (e) {
                var selectedChartType = $customizeChart.attr('selectedChartType');
                if (selectedChartType) {
                    selectedChartType = selectedChartType.split('-');
                    chartOpts.widgetType = selectedChartType[0];
                    chartOpts.chartType = selectedChartType[1];
                    extendedOpts.callback && extendedOpts.callback(chartOpts, optionalParams);
                }
            });
		});
    }
    
    function _extendToWidget(chartId) {
        var chartTypes = _.map(_chartTypes, function (value, index, list) {
            return '<li><a href="javascript:void(0)" class="gswidget-btn chartType" chartType="' + value + '">' + value + '</a></li>';
		});
        var widgetTpl = [
            // '<div id="<widgetId>" class="gswidget">', 
                '<div class="gswidget-tool">',
                    '<button type="button" class="btn btn-default gswidget-btn gswidget-tool-btn exchange-btn"><i class="fa fa-exchange"></i></button>',
                    '<button type="button" class="btn btn-default gswidget-btn gswidget-tool-btn config-btn"><i class="fa fa-cog"></i></button>',
                    '<button type="button" class="btn btn-default gswidget-btn gswidget-tool-btn edit-btn"><i class="fa fa-edit"></i></button>',
                    '<button type="button" class="btn btn-default gswidget-btn gswidget-tool-btn close-btn"><i class="fa fa-close"></i></button>',
                '</div>',
                '<div class="gswidget-config">',
                    '<div class="btn-group"> ',
                    '  <button type="button" class="btn btn-default gswidget-btn table-mode"><i class="fa fa-table"></i></button>',
                    '	<div class="btn-group">                                                                                       ',
                    '	  <button type="button" class="btn btn-default gswidget-btn chart-mode"><i class="fa fa-bar-chart-o"></i></button>  ',
                    '	  <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-expanded="false"> ',
                    '		<span class="caret"></span>                                                                               ',
                    '	  </button>                                                                                                   ',
                    '	  <ul class="dropdown-menu gscolumns"> ', /*pull-right*/
                            chartTypes.join(''),
                    '	  </ul> ',
                    '	</div> ',
                    '</div>',
                    '<div class="btn-group plotOptions"> ',
                    '  	<button type="button" class="btn btn-default gswidget-btn options-mode">options</button>',
                    '</div> ',
                '</div>',
                '<div class="gswidget-table">',
                    '<div class="gswidget-table-container">',
                        '<table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered table-hover"></table>',
                    '</div>',
                '</div>',
                '<div class="gswidget-chart gswidget-subitem-shown">',
                    '<div id="gswidget_content_<widgetId>" class="gswidget-chart-container"></div>',
                '</div>'
            // '</div>'
        ].join('');
        widgetTpl = widgetTpl.replace(/<widgetId>/g, chartId);
        $('#' + chartId).empty().addClass('gswidget').append(widgetTpl);
    }
    
    function _renderDataTable(chartOpts, $gswidget) {
        var $tableContainer = $('.gswidget-table .gswidget-table-container', $gswidget).empty();
        $tableContainer.append('<table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered table-hover"></table>');
        var chartData = chartOpts.chartData,
            columns = _.map(chartData.columns, function (value, index, list) {return {'title' : value}}),
            dtConfig = $.extend({}, _datatablesCfg, {
                data : chartData.rows,
                columns : columns
            });
        $('table', $tableContainer).dataTable(dtConfig);
        /* 
        var $tableElement = $('.gswidget-table .gswidget-table-container > table', $gswidget)
        if ($tableElement.length > 0) {
            var chartData = chartOpts.chartData,
                columns = _.map(chartData.columns, function (value, index, list) {return {'title' : value}}),
                dtConfig = $.extend({}, _datatablesCfg, {
                    data : chartData.rows,
                    columns : columns
                });
            $tableElement.dataTable(dtConfig); 
        }
        */
    }
    
    function _rigisterListener(chartOpts, optionalParams, extendedOpts) {
        var containerId = chartOpts.container;
        $('#' + containerId).on('click', '.gswidget-btn', 
            {'chartOpts' : chartOpts, 'optionalParams' : optionalParams, 'extendedOpts' : extendedOpts}, function (e) {
            var $this = $(this), $gswidget = $(e.delegateTarget), selChartType = '';
                // Temporary commented out for demonstration.(The commented out is for avoiding closure.)
                // chartOpts = e.data.chartOpts, //ToDO: The chartOpts can be got from the chart container data.
                // optionalParams = e.data.optionalParams, extendedOpts = e.data.extendedOpts;
            if ($this.hasClass('exchange-btn')) {
                _chooseChart(chartOpts, optionalParams, {
                    'title' : '切换报表',
                    'callback' : function (chartOpts, optionalParams) {
                        gscharts.renderChart(chartOpts, optionalParams);
                    }
                });
            } else if ($this.hasClass('config-btn')) {
                $('.gswidget-config', $gswidget).toggleClass('config-shown');
            } else if ($this.hasClass('edit-btn')) {
                extendedOpts.editHandle && extendedOpts.editHandle.call(this, e, chartOpts, optionalParams);
            } else if ($this.hasClass('close-btn')) {
                $gswidget.remove();
                extendedOpts.closeHandle && extendedOpts.closeHandle.call(this, e, chartOpts, optionalParams);
            } else if ($this.hasClass('table-mode')) {
                $('.plotOptions', $gswidget).removeClass('plotOptions-shown');
                $('.gswidget-chart', $gswidget).removeClass('gswidget-subitem-shown');
                $('.gswidget-table', $gswidget).addClass('gswidget-subitem-shown');
                _renderDataTable(chartOpts, $gswidget);
            } else if ($this.hasClass('chart-mode')) {
                $('.plotOptions', $gswidget).addClass('plotOptions-shown');
                $('.gswidget-chart', $gswidget).addClass('gswidget-subitem-shown');
                $('.gswidget-table', $gswidget).removeClass('gswidget-subitem-shown');
            } else if ($this.hasClass('options-mode')) {
                _customizePlot(chartOpts, optionalParams, {
                    'callback' : function (cbChartOpts, cbOptionalParams) {
                        cbChartOpts.container = chartOpts.container;
                        chartOpts = cbChartOpts;
                        optionalParams = cbOptionalParams;
                        gscharts.renderChart(cbChartOpts, cbOptionalParams);
                    }
                });
            } else if ($this.hasClass('chartType')) {
                $('.plotOptions', $gswidget).addClass('plotOptions-shown');
                $('.gswidget-chart', $gswidget).addClass('gswidget-subitem-shown');
                $('.gswidget-table', $gswidget).removeClass('gswidget-subitem-shown');
                
                chartOpts.chartType = $this.attr('chartType');
                gscharts.renderChart(chartOpts, optionalParams);
            }
        });
    }
    
    function _renderExtendedChart(chartOpts, optionalParams, extendedOpts) {
        chartOpts = $.extend(true, {}, chartOpts);
        optionalParams = optionalParams || {};
        extendedOpts = extendedOpts || {};
        
        _extendToWidget(chartOpts.container);
        _rigisterListener(chartOpts, optionalParams, extendedOpts);
        
        chartOpts.container = 'gswidget_content_' + chartOpts.container;
        gscharts.renderChart(chartOpts, optionalParams);
    }
	
	return {
		customizePlot : _customizePlot,
        chooseChart : _chooseChart, 
        renderExtendedChart : _renderExtendedChart
	};
});