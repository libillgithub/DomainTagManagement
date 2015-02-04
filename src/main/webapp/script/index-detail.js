define(['datatables', 'dataTables-tableTools', 'DT_bootstrap', 'underscore', 'bootstrap3-editable'], function () {
    var _listUrl = '/script/data/gsdata.json', _tagUrl = '/script/data/gsdata.json';
    var _datatables = null,
        _datatablesCfg = {
            'searching' : false,
            'aLengthMenu': [10, 30, 50, 100, 200],
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
            ,'dom' : '<"row"f><"table-scrollable"rt><"row"<"col-md-3 col-sm-12"l><"col-md-4 col-sm-12"i><"col-md-5 col-sm-12"p>>'
        },
        _dialogTpl = [
			'<div class="modal fade subChannelModal" id="subChannelModal" tabindex="-1" role="basic" aria-hidden="true"> ',
			'	<div class="modal-dialog modal-lg">                                                                       ',
			'		<div class="modal-content">                                                                           ',
			'			<div class="modal-header">                                                                        ',
			'				<button type="button" class="close" data-dismiss="modal" aria-hidden="true"></button>         ',
			'				<h4 class="modal-title">域名信息修改</h4>                                                       ',
			'			</div>                                                                                            ',
			'			<div class="modal-body modal-body-chart">                                                         ',
			'				<div class="row">                                                                             ',
                                '<div class="col-sm-12 col-md-12">',
                                    '<form class="form-inline">                                                                 ',
                                    '  <div class="form-group">                                                                 ',
                                    '    <label for="CompanyNameInput">公司名字</label>                                            ',
                                    '    <input type="text" class="form-control" id="CompanyNameInput" placeholder=""> ',
                                    '  </div>                                                                                   ',
                                    '  <div class="form-group">                                                                 ',
                                    '    <label for="WebsiteNameInput">网站名字</label>                               ',
                                    '    <input type="text" class="form-control" id="WebsiteNameInput" placeholder="">   ',
                                    '  </div>                                                                                   ',
                                    '</form>                                                                                    ',
                                    '<div class="tableContainer">',
                                        '<div class="tableTool">                                                ',
                                        '    <label>子频道</label>',
										'	 <a href="javascript:void(0);" class="btn add"><i class="fa fa-plus"></i></a>       ',
                                        '    <a href="javascript:void(0);" class="btn edit"><i class="fa fa-edit"></i></a>        ',
                                        '    <a href="javascript:void(0);" class="btn remove"><i class="fa fa-times"></i></a>    ',
										'</div>                                                                ',
                                        '<table id="detailTable" cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered table-hover"></table>',
                                    '</div>',
                                '</div>',
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
    
    function _show(oTr, oDatatable) {
        var $domainModalContainer = $('#domain-management-modals');
        $domainModalContainer.empty().removeData();
		$domainModalContainer.append(_dialogTpl);

        //simulated data
        var columns = ['empty', 'url', 'name', 'tag'],
            rows = [
                ['www.baidu.com', '百度公司', 'IT,搜索,互联网'],
                ['www.sogou.com', '搜狗公司', 'IT,搜索,互联网'],
                ['www.google.com', '谷歌公司', 'IT,搜索,互联网']
            ];
        
        rows = _.map(rows, function (value, index, list) {value.unshift(''); return value;});
        var dtColumns = _.map(columns, function (value, index, list) {return {'title' : value}}),
            dtConfig = $.extend({}, _datatablesCfg, {
                'data': rows || [],
                'columns': dtColumns,
                'order': [ 1, 'asc' ],
                'columnDefs': [
                    {
                        'render': function (data, type, row) {
                            return '<input type="checkbox" class="checkboxes" value="' + row[1] + '"/>';
                        },
                        'orderable': false,
                        'targets': 0
                    },
                    {
                        'render': function (data, type, row) {
                            return '<a class="editZone">' + data + '</a>';
                        },
                        'className': 'editableTd',
                        'targets': 1
                    },
                    {
                        'visible' : false,
                        'targets': 2
                    },
                    {
                        'render': function (data, type, row) {
                            var tpl = [], dataArray = data.split(',');
                            dataArray = (data.length === 0) ? [] : dataArray; 
                            tpl = _.map(dataArray, function (value, index, list) {
                                return '<h5 data-rowId="' + row[1] + '" class="tagContainer"><span class="tagLabel">' + value + '</span><button type="button" class="close tag-btn removeTag"></button></h5>';
                            })
                            return tpl.join('') + '<h5 data-rowId="' + row[1] + '" class="newTagContainer"><button class="tag-btn addNewTag"></button></h5>';
                        },
                        'width' : '300px',
                        'targets': -1
                    }
                ],
                'headerCallback' : function (thead, data, start, end, display) {
                    $(thead).find('th').eq(0).css('width', '18px').html('<input type="checkbox" class="group-checkable" id="groupCheckbox"/>');
                }
            });
        _datatables = $('#detailTable', $domainModalContainer).dataTable(dtConfig);
        
		$('#subChannelModal').modal('show').off('shown.bs.modal').on('shown.bs.modal', function (e) {
            $subChannelModal = $(this);
            
            $subChannelModal.on('click', '.group-checkable', function (e) {
                var checked = $(this).is(':checked');
                $('table tbody .checkboxes', $subChannelModal).attr('checked', checked);
            });
            
            $subChannelModal.on('click', '.tag-btn', function (e) {
                var $this = $(this);
                if ($this.hasClass('removeTag')) {
                    var currentTr = $this.closest('tr');
                    $this.closest('.tagContainer').remove();
                    // var tdData = _datatables.fnGetData(currentTd[0]);
                    var tags = [];
                    $('.tagLabel', currentTr).each(function (index) {
                        tags.push($(this).html());
                    });
                    _datatables.fnUpdate(tags.join(','), currentTr, -1, false);
                    _datatables.fnDraw();
                } else if ($this.hasClass('addNewTag')) {
                    $this.editable({
                        onblur : 'submit',
                        showbuttons : false,
                        toggle : 'manual',
                        highlight : false,
                        emptytext : '',
                        display: false,
                        url : function (params) {
                            var selectedId = $this.closest('h5').attr('data-rowId');
                            var tpl = '<h5 data-rowId="' + selectedId + '" class="tagContainer"><span class="tagLabel">' + params.value + '</span><button type="button" class="close tag-btn removeTag"></button></h5>';
                            $this.closest('.newTagContainer').before(tpl); 
                            
                            var currentTr = $this.closest('tr');
                            var tags = [];
                            $('.tagLabel', currentTr).each(function (index) {
                                tags.push($(this).html());
                            });
                            _datatables.fnUpdate(tags.join(','), currentTr, -1, false);
                            _datatables.fnDraw();
                        }
                    }).editable('setValue', '').editable('toggle');
                }
            });
            
            $('.tableTool', $subChannelModal).on('click', '.btn', function (e) {
                e.stopPropagation(); // Prevents the event from bubbling up the DOM tree, or It will affected the xeditable plugin shown.
                var $this = $(this);
                if ($this.hasClass('add')) {
                    var newRows = _datatables.fnAddData(['', '', '', '']);
                    var nRow = _datatables.fnGetNodes(newRows[0]);
                    $('.editZone', nRow).editable({
                        mode : 'inline',
                        toggle : 'manual',
                        emptytext : '',
                        url : function (params) {
                            _datatables.fnUpdate(params.value, nRow, 1, false);
                            _datatables.fnDraw();
                        }
                    }).editable('show');
                } else if ($this.hasClass('edit')) {
                    var nRow = $('#detailTable .checkboxes:checked', $subChannelModal).eq(0).closest('tr');
                    $('.editZone', nRow).editable({
                        mode : 'inline',
                        toggle : 'manual',
                        emptytext : '',
                        url : function (params) {
                            _datatables.fnUpdate(params.value, nRow, 1, false);
                            _datatables.fnDraw();
                        }
                    }).editable('show'); 
                } else { //remove
                    var nodes = $('#detailTable', $subChannelModal).DataTable().column(0).nodes();
                    $(':checked', nodes).each(function (index) {
                        var nRow = $(this).closest('tr');
                        _datatables.fnDeleteRow(nRow);
                    });
                }
            });
            
            $('table tbody', $subChannelModal).on('click', '.editZone', function (e) {
                var nRow = $(this).closest('tr');
                $(this).editable({
                    mode : 'inline',
                    toggle : 'manual',
                    url : function (params) {
                        _datatables.fnUpdate(params.value, nRow, 1, false);
                        _datatables.fnDraw();
                    }
                }).editable('show');
            });
            
            $('#modalSaveBtn', $subChannelModal).on('click', function (e) {
                console.log('save.');
                var tableData = _datatables.fnGetData();
                _.map(tableData, function (value, index, list) {
                    value.shift();
                    return value;
                });
                var subChannelData = {
                    'companyName' : $('#CompanyNameInput').val(),
                    'websiteName' : $('#WebsiteNameInput').val(),
                    'subChannels' : tableData
                } 
                console.dir(subChannelData);
            });
		});
    }
    
    return {
        'show' : _show
    };
});