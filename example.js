 Ext.override(Rally.ui.cardboard.CardBoard,{
            _buildColumnsFromModel: function() {
                var me = this;
                var model = this.models[0];
                if (model) {
                    if ( this.attribute === "Release" ) { 
                        var retrievedColumns = [];
                        retrievedColumns.push({
                            value: null,
                            columnHeaderConfig: {
                                headerTpl: "{name}",
                                headerData: {
                                    name: "Backlog"
                                }
                            }
                        });
                        this._getLocalReleases(retrievedColumns, this.globalVar);
                    }
                }
            },          
            _getLocalReleases: function(retrievedColumns, today_iso) {
                var me = this; 
                if (today_iso == undefined) {
                    today_iso = Rally.util.DateTime.toIsoString(new Date(),false);
                }   
                var filters = [{property:'ReleaseDate',operator:'>',value:today_iso}];
                var iteration_names = [];
                Ext.create('Rally.data.WsapiDataStore',{
                    model:me.attribute,
                    autoLoad: true,
                    filters: filters,
                    context: { projectScopeUp: false, projectScopeDown: false },
                    sorters: [
                        {
                            property: 'ReleaseDate',
                            direction: 'ASC'
                        }
                    ],
                    //limit: Infinity,
                    pageSize: 4,
                    //buffered: true,
                    //purgePageCount: 4,
                    fetch: ['Name','ReleaseStartDate','ReleaseDate','PlannedVelocity'],
                    listeners: {
                        load: function(store,records) {
                            Ext.Array.each(records, function(record){
                                console.log("records values", records);
                                var start_date = Rally.util.DateTime.formatWithNoYearWithDefault(record.get('ReleaseStartDate'));
                                var end_date = Rally.util.DateTime.formatWithNoYearWithDefault(record.get('ReleaseDate'));
                                //this._getMileStones(record.get('ReleaseStartDate'), record.get('ReleaseDate'), this.project);
                                iteration_names.push(record.get('Name'));
                                //iteration_names.push(record.get('ReleaseDate'));
                                retrievedColumns.push({
                                    value: record,
                                    _planned_velocity: 0,
                                    _actual_points: 0,
                                    _missing_estimate: false,
                                    columnHeaderConfig: {
                                        headerTpl: "{name}<br/>{start_date} - {end_date}",
                                        headerData: {
                                            name: record.get('Name'),
                                            start_date: start_date,
                                            end_date: end_date,
                                            planned_velocity: 0,
                                            actual_points: 0,
                                            missing_estimate: false
                                        }
                                    }
                                });
                            });
                            this._getAllReleases(retrievedColumns,iteration_names);
                        },
                        scope: this
                    }
                });
            },
            _getAllReleases: function(retrievedColumns,iteration_names, today_iso) {
                var me = this; 
                if (today_iso == undefined) {
                    today_iso = Rally.util.DateTime.toIsoString(new Date(),false);
                }   
                var filters = [{property:'ReleaseDate',operator:'>',value:today_iso}];
                Ext.create('Rally.data.WsapiDataStore',{
                    model:me.attribute,
                    autoLoad: true,
                    filters: filters,
                    sorters: [
                        {
                            property: 'ReleaseDate',
                            direction: 'ASC'
                        }
                    ],
                    fetch: ['Name','Project','PlannedVelocity'],
                    listeners: {
                        load: function(store,records) {
                            Ext.Array.each(records, function(record){
                                var planned_velocity = record.get('PlannedVelocity') || 0;
                                var actual_points = record.get('LeafStoryPlanEstimateTotal') || 0;
                                var index = Ext.Array.indexOf(iteration_names[0],record.get('Name'));
                                if (planned_velocity == 0 ) {
                                    retrievedColumns[index+1]._missing_estimate = true;
                                }
                                retrievedColumns[index+1]._actual_points += actual_points;                                          
                                retrievedColumns[index+1]._planned_velocity += planned_velocity;
                            });
                            this.fireEvent('columnsretrieved',this,retrievedColumns);
                            this.columnDefinitions = [];
                            _.map(retrievedColumns,this.addColumn,this);
                            this._renderColumns();
                        },
                        scope: this
                    }
                });
            }       
        });

        Ext.define('Rally.technicalservices.plugin.ColumnHeaderUpdater', {
            alias: 'plugin.tscolumnheaderupdater',
            extend: 'Ext.AbstractPlugin',
            config: {
                /**
                 * 
                 * @type {String} The name of the field holding the card's estimate
                 * 
                 * Defaults to c_FeatureEstimate (try LeafStoryPlanEstimateTotal)
                 */
                field_to_aggregate: "planned_velocity",
                /**
                 * @property {Number} The current count of feature estimates
                 */
                total_feature_estimate: 0,
                fieldToDisplay: "actual_points",
                /**
                 * @property {String|Ext.XTemplate} the header template to use 
                 */
                headerTpl: new Rally.technicalservices.template.LabeledProgressBarTemplate({
                    fieldLabel: 'Features Planned vs Planned Velocity: ',
                    calculateColorFn: function(data) {
                        if ( data.percentDone > 0.9 ) {
                            return '#EDB5B1';
                        } 
                        return '#99CCFF';
                    },
                    showDangerNotificationFn: function(data) {
                        return data.missing_estimate;
                    },
                    generateLabelTextFn: function(data) {
                        if ( data.percentDone === -1 ) {
                            return "No Planned Velocity";
                        } else {
                            var text_string = "";
                            if ( data.field_to_aggregate === "planned_velocity" ) {
                                text_string = this.calculatePercent(data) + '%';
                            } else {
                                text_string = 'By Story: ' + this.calculatePercent(data) + '%';
                            }
                            return text_string;
                        }
                    }
                })      
                //headerTpl: '<div class="wipLimit">({total_feature_estimate} of {planned_velocity})</div>'
            },

            constructor: function(config) {
                this.callParent(arguments);
                if(Ext.isString(this.headerTpl)) {
                    this.headerTpl = Ext.create('Ext.XTemplate', this.headerTpl);
                }

            },

            init: function(column) {
                this.column = column;
                if ( column.value === null ) {
                    this.headerTpl = new Ext.XTemplate('');
                }
                this.planned_velocity = this.column._planned_velocity;
                this.missing_estimate = this.column._missing_estimate;
                this.actual_points = this.column._actual_points;

                this.column.on('addcard', this.recalculate, this);
                this.column.on('removecard', this.recalculate, this);
                this.column.on('storeload', this.recalculate, this);
                this.column.on('afterrender', this._afterRender, this);
                this.column.on('ready', this.recalculate, this);
                this.column.on('datachanged', this.recalculate, this);

            },
            destroy: function() {
                if(this.column) {
                    delete this.column;
                }
            },
            _afterRender: function() {
                if ( this.feature_estimate_container ) {
                    this.feature_estimate_container.getEl().on('click', this._showPopover, this);
                }
            },
            recalculate: function() {
                this.total_feature_estimate = this.getTotalFeatureEstimate();
                this.refresh();
            },
            refresh: function() {
                var me = this;
                if (this.feature_estimate_container) {
                    this.feature_estimate_container.update(this.headerTpl.apply(this.getHeaderData()));
                } else {
                    this.feature_estimate_container = Ext.widget({
                        xtype: 'container',
                        html: this.headerTpl.apply(this.getHeaderData())
                    });

                    this.column.getColumnHeader().getHeaderTitle().add(this.feature_estimate_container);
                }
                if ( this.feature_estimate_container && this.feature_estimate_container.getEl()) {
                    this.feature_estimate_container.getEl().on('click', this._showPopover, this);
                }
            },
            _showPopover: function() {
                var me = this;
                if ( me.planned_velocity > 0 ) {
                    if ( this.popover ) { this.popover.destroy(); }
                    this.popover = Ext.create('Rally.ui.popover.Popover',{
                        target: me.column.getColumnHeader().getHeaderTitle().getEl(),
                        items: [ me.getSummaryGrid() ]
                    });

                    this.popover.show();
                }
            },

            getSummaryGrid: function() {
                var me = this;
                var estimate_title = "Feature Estimates";
                if ( this.field_to_aggregate !== "c_FeatureEstimate") {
                    estimate_title = "Story Estimates";
                }
                var store = Ext.create('Rally.data.custom.Store',{
                    data: [
                        {
                            'PlannedVelocity': me.planned_velocity,
                            'ActualPoints': me.actual_points,
                            'TotalEstimate': me.getTotalFeatureEstimate(),
                            'Remaining': me.getCapacity(),
                            'MissingEstimate': me.missing_estimate
                        }
                    ]
                });
                var grid = Ext.create('Rally.ui.grid.Grid',{
                    store: store,
                    columnCfgs: [
                        { text: 'Plan', dataIndex:'PlannedVelocity' },
                        { text: estimate_title, dataIndex: 'TotalEstimate' },
                        { text: 'Remaining', dataIndex: 'Remaining' },
                        { text: 'Team Missing Plan?', dataIndex: 'MissingEstimate' }
                    ],
                    showPagingToolbar: false
                });
                return grid;
            },

            getHeaderData: function() {
                var total_feature_estimate = this.getTotalFeatureEstimate();
                actual_points = 0;
                var percent_done = -1;
                planned_velocity = 20;
                if ( planned_velocity > 0 ) {
                    percent_done = total_feature_estimate / 4;
                }
                return {
                    actual_points: actual_points,
                    total_feature_estimate: total_feature_estimate,
                    planned_velocity: planned_velocity,
                    percentDone: percent_done,
                    field_to_aggregate: this.field_to_aggregate,
                    missing_estimate: this.missing_estimate
                };
            },

            getCapacity: function() {
                return this.planned_velocity - this.getTotalFeatureEstimate();
            },

            getTotalFeatureEstimate: function() {
                var me = this;
                var total = 0;
                var total_unaligned = 0;
                var records = this.column.getRecords();
                Ext.Array.each(records, function(record){
                    var total_points = record.get('AcceptedLeafStoryPlanEstimateTotal');
                    var feature_estimate = record.get(me.field_to_aggregate) || 0;
                    var unaligned_estimate = record.get('UnalignedStoriesPlanEstimateTotal') || 0;
                    total += parseFloat(total_points,10);
                });

                if ( me.field_to_aggregate !== "planned_velocity" ) {
                    total = total
                }
                return total;
            }
        });   