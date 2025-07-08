const { useState, useEffect } = React;

function DeviceManagement() {
    const [devices, setDevices] = useState([]);
    const [filteredDevices, setFilteredDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [customerInfo, setCustomerInfo] = useState(null);
    const [mdmServers, setMdmServers] = useState([]);
    const [filters, setFilters] = useState({
        status: 'all',
        model: 'all',
        search: '',
        purchaseSource: 'all',
        color: 'all'
    });
    const [advancedFilters, setAdvancedFilters] = useState({
        showAdvanced: false
    });
    const [showMdmServers, setShowMdmServers] = useState(false);
    const [selectedMdmServer, setSelectedMdmServer] = useState(null);
    const [showMdmDetail, setShowMdmDetail] = useState(false);
    const [selectedDevices, setSelectedDevices] = useState(new Set());
    const [assignedToServer, setAssignedToServer] = useState([]);
    const [unassignedDevices, setUnassignedDevices] = useState([]);
    const [unassignedDeviceSearch, setUnassignedDeviceSearch] = useState('');
    const [assignedDeviceSearch, setAssignedDeviceSearch] = useState('');
    const [filteredAssignedDevices, setFilteredAssignedDevices] = useState([]);
    const [filteredUnassignedDevices, setFilteredUnassignedDevices] = useState([]);

    const customerId = new URLSearchParams(window.location.search).get('customer');

    const fetchCustomerInfo = async () => {
        try {
            const response = await fetch(`/api/customers/${customerId}`);
            const data = await response.json();
            setCustomerInfo(data);
        } catch (error) {
            console.error('Error fetching customer info:', error);
        }
    };

    const fetchDevices = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/${customerId}/devices`);
            const data = await response.json();
            setDevices(data.data || []);
        } catch (error) {
            console.error('Error fetching devices:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMdmServers = async () => {
        try {
            const response = await fetch(`/api/${customerId}/mdmServers`);
            const data = await response.json();
            setMdmServers(data.data || []);
        } catch (error) {
            console.error('Error fetching MDM servers:', error);
        }
    };

    useEffect(() => {
        if (customerId) {
            fetchDevices();
            fetchCustomerInfo();
            fetchMdmServers();
        }
    }, [customerId]);

    useEffect(() => {
        applyFilters();
    }, [devices, filters]);

    useEffect(() => {
        // Filter assigned devices based on search
        if (assignedDeviceSearch) {
            const filtered = assignedToServer.filter(device =>
                device.attributes?.serialNumber?.toLowerCase().includes(assignedDeviceSearch.toLowerCase()) ||
                device.attributes?.deviceModel?.toLowerCase().includes(assignedDeviceSearch.toLowerCase()) ||
                device.id?.toLowerCase().includes(assignedDeviceSearch.toLowerCase())
            );
            setFilteredAssignedDevices(filtered);
        } else {
            setFilteredAssignedDevices(assignedToServer);
        }
    }, [assignedToServer, assignedDeviceSearch]);

    useEffect(() => {
        // Filter unassigned devices based on search
        if (unassignedDeviceSearch) {
            const filtered = unassignedDevices.filter(device =>
                device.attributes?.serialNumber?.toLowerCase().includes(unassignedDeviceSearch.toLowerCase()) ||
                device.attributes?.deviceModel?.toLowerCase().includes(unassignedDeviceSearch.toLowerCase()) ||
                device.id?.toLowerCase().includes(unassignedDeviceSearch.toLowerCase())
            );
            setFilteredUnassignedDevices(filtered);
        } else {
            setFilteredUnassignedDevices(unassignedDevices);
        }
    }, [unassignedDevices, unassignedDeviceSearch]);

    const applyFilters = () => {
        let filtered = devices;

        if (filters.status !== 'all') {
            filtered = filtered.filter(device => 
                device.attributes?.status?.toLowerCase() === filters.status.toLowerCase()
            );
        }

        if (filters.model !== 'all') {
            filtered = filtered.filter(device => 
                device.attributes?.deviceModel?.includes(filters.model)
            );
        }

        if (filters.purchaseSource !== 'all') {
            filtered = filtered.filter(device => 
                device.attributes?.purchaseSourceType === filters.purchaseSource
            );
        }

        if (filters.color !== 'all') {
            filtered = filtered.filter(device => 
                device.attributes?.color?.toLowerCase() === filters.color.toLowerCase()
            );
        }

        if (filters.search) {
            filtered = filtered.filter(device => 
                device.attributes?.serialNumber?.toLowerCase().includes(filters.search.toLowerCase()) ||
                device.attributes?.deviceModel?.toLowerCase().includes(filters.search.toLowerCase()) ||
                device.id?.toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        setFilteredDevices(filtered);
    };

    const getStats = () => {
        const assigned = devices.filter(d => d.attributes?.status === 'ASSIGNED').length;
        const unassigned = devices.filter(d => d.attributes?.status === 'UNASSIGNED').length;
        const manual = devices.filter(d => d.attributes?.purchaseSourceType === 'MANUALLY_ADDED').length;
        const reseller = devices.filter(d => d.attributes?.purchaseSourceType === 'RESELLER').length;

        return { assigned, unassigned, manual, reseller, total: devices.length };
    };

    const getUniqueValues = (field) => {
        const values = new Set();
        devices.forEach(device => {
            const value = field === 'model' ? device.attributes?.deviceModel : device.attributes?.[field];
            if (value) {
                values.add(value);
            }
        });
        return Array.from(values).sort();
    };

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    const getAssignedServerName = (device) => {
        // This function is now simplified. It will only show a generic status on the main card.
        if (device.attributes?.status === 'ASSIGNED') {
            return 'Assigned';
        }
        return 'N/A';
    };

    const quickFilter = (filterType) => {
        const newFilters = { ...filters };
        
        switch(filterType) {
            case 'unassigned':
                newFilters.status = 'unassigned';
                break;
            case 'assigned':
                newFilters.status = 'assigned';
                break;
            case 'manual':
                newFilters.purchaseSource = 'MANUALLY_ADDED';
                break;
            case 'reseller':
                newFilters.purchaseSource = 'RESELLER';
                break;
            case 'reset':
                newFilters.status = 'all';
                newFilters.model = 'all';
                newFilters.purchaseSource = 'all';
                newFilters.color = 'all';
                newFilters.search = '';
                break;
        }
        
        setFilters(newFilters);
    };

    const showMdmServerDetail = async (server) => {
        setSelectedMdmServer(server);
        
        // This logic needs to be updated to not rely on deviceServerMap
        // For now, we will disable this part to fix the main issue.
        alert("Viewing devices by server is temporarily disabled to improve performance. Please filter by 'Assigned' status instead.");
        return;

        /*
        // Get assigned devices for this server using the server mapping
        const assigned = devices.filter(device => {
            const serverInfo = deviceServerMap.get(device.id);
            return serverInfo && serverInfo.id === server.id;
        });
        
        // Get unassigned devices
        const unassigned = devices.filter(device => 
            device.attributes?.status === 'UNASSIGNED'
        );
        
        setAssignedToServer(assigned);
        setUnassignedDevices(unassigned);
        setSelectedDevices(new Set());
        setAssignedDeviceSearch('');
        setUnassignedDeviceSearch('');
        setShowMdmDetail(true);
        */
    };

    const toggleDeviceSelection = (deviceId) => {
        const newSelected = new Set(selectedDevices);
        if (newSelected.has(deviceId)) {
            newSelected.delete(deviceId);
        } else {
            newSelected.add(deviceId);
        }
        setSelectedDevices(newSelected);
    };

    const selectAllFilteredUnassigned = () => {
        const allFilteredSelected = filteredUnassignedDevices.length > 0 && filteredUnassignedDevices.every(d => selectedDevices.has(d.id));
        const newSelected = new Set(selectedDevices);

        if (allFilteredSelected) {
            // Deselect all filtered
            filteredUnassignedDevices.forEach(d => newSelected.delete(d.id));
        } else {
            // Select all filtered
            filteredUnassignedDevices.forEach(d => newSelected.add(d.id));
        }
        setSelectedDevices(newSelected);
    };

    const assignSelectedDevices = async () => {
        if (selectedDevices.size === 0) {
            alert('Please select devices to assign');
            return;
        }

        try {
            const payload = {
                data: {
                    type: "orgDeviceActivities",
                    attributes: {
                        activityType: "ASSIGN_DEVICES"
                    },
                    relationships: {
                        mdmServer: {
                            data: {
                                type: "mdmServers",
                                id: selectedMdmServer.id
                            }
                        },
                        devices: {
                            data: Array.from(selectedDevices).map(deviceId => ({
                                type: "orgDevices",
                                id: deviceId
                            }))
                        }
                    }
                }
            };

            const response = await fetch(`/api/${customerId}/orgDeviceActivities`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert(`Successfully assigned ${selectedDevices.size} devices!`);
                setShowMdmDetail(false);
                await fetchDevices(); // Refresh device list
            } else {
                alert('Error assigning devices');
            }
        } catch (error) {
            alert('Error assigning devices: ' + error.message);
        }
    };

    if (!customerId) {
        return (
            <div className="container">
                <div className="header">
                    <h1>Error: No customer specified</h1>
                    <p>Please provide a customer ID in the URL parameters.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading devices...</p>
                </div>
            </div>
        );
    }

    const stats = getStats();
    const uniqueModels = getUniqueValues('model');
    const uniqueColors = getUniqueValues('color');

    return (
        <div className="container">
            <div className="header atea-header">
                <div className="header-content">
                    <img src="/frontend/images/logo.jpg" alt="Atea Logo" className="header-logo"/>
                    <div>
                        <h1>Device Management</h1>
                        <p>
                            {customerInfo ? `${customerInfo.name} - ${customerInfo.manager_type === 'business' ? 'Apple Business Manager' : 'Apple School Manager'}` : 'Loading customer info...'}
                        </p>
                    </div>
                </div>
                
                <div className="header-links">
                    <a href={`/swagger/${customerId}`} target="_blank" className="header-link api-link">
                        📋 API Docs
                    </a>
                    {customerInfo?.gsx_api_key && (
                        <a href={`/frontend/gsx-search.html?customer=${customerId}`} className="header-link">
                            🔍 GSX Search
                        </a>
                    )}
                    <a href="/frontend/" className="header-link">
                        🏠 Admin Panel
                    </a>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card assigned" onClick={() => quickFilter('assigned')} style={{cursor: 'pointer'}}>
                    <div className="stat-number" style={{color: '#10b981'}}>{stats.assigned}</div>
                    <div className="stat-label">Assigned Devices</div>
                </div>
                <div className="stat-card unassigned" onClick={() => quickFilter('unassigned')} style={{cursor: 'pointer'}}>
                    <div className="stat-number" style={{color: '#f59e0b'}}>{stats.unassigned}</div>
                    <div className="stat-label">Unassigned Devices</div>
                </div>
                <div className="stat-card manual" onClick={() => quickFilter('manual')} style={{cursor: 'pointer'}}>
                    <div className="stat-number" style={{color: '#8b5cf6'}}>{stats.manual}</div>
                    <div className="stat-label">Manually Added</div>
                </div>
                <div className="stat-card reseller" onClick={() => quickFilter('reseller')} style={{cursor: 'pointer'}}>
                    <div className="stat-number" style={{color: '#ef4444'}}>{stats.reseller}</div>
                    <div className="stat-label">From Reseller</div>
                </div>
                <div className="stat-card" style={{borderLeftColor: '#6366f1', cursor: 'pointer'}} onClick={() => setShowMdmServers(!showMdmServers)}>
                    <div className="stat-number" style={{color: '#6366f1'}}>{mdmServers.length}</div>
                    <div className="stat-label">MDM Servers</div>
                </div>
            </div>

            {showMdmServers && (
                <div className="mdm-servers-section">
                    <h3 style={{margin: '0 0 1rem 0', color: '#1f2937'}}>Available MDM Servers</h3>
                    {mdmServers.length > 0 ? (
                        <div className="mdm-servers-grid">
                            {mdmServers.map(server => (
                                <div key={server.id} className="mdm-server-card">
                                    <div className="mdm-server-name">
                                        {server.attributes?.serverName || server.attributes?.name || server.id}
                                    </div>
                                    <div className="mdm-server-info">
                                        <div><strong>Organization:</strong> {server.attributes?.organizationName || 'N/A'}</div>
                                        <div><strong>Server ID:</strong> {server.id}</div>
                                        {server.attributes?.serverUrl && (
                                            <div><strong>URL:</strong> {server.attributes.serverUrl}</div>
                                        )}
                                    </div>
                                    <button 
                                        className="mdm-toggle"
                                        onClick={() => showMdmServerDetail(server)}
                                    >
                                        View Device Assignments
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{color: '#6b7280', textAlign: 'center', margin: '2rem 0'}}>
                            No MDM servers configured for this customer.
                        </p>
                    )}
                    <button 
                        className="btn btn-secondary" 
                        onClick={() => setShowMdmServers(false)}
                        style={{marginTop: '1rem'}}
                    >
                        Hide MDM Servers
                    </button>
                </div>
            )}

            <div className="filters">
                <div className="filter-row">
                    <button className={`btn-filter ${filters.status === 'all' && filters.purchaseSource === 'all' ? 'active' : ''}`} onClick={() => quickFilter('reset')}>Show All</button>
                    <button className={`btn-filter ${filters.status === 'unassigned' ? 'active' : ''}`} 
                            onClick={() => quickFilter('unassigned')}>Unassigned Only</button>
                    <button className={`btn-filter ${filters.status === 'assigned' ? 'active' : ''}`} 
                            onClick={() => quickFilter('assigned')}>Assigned Only</button>
                    <button className="btn-filter" 
                            onClick={() => setAdvancedFilters(prev => ({...prev, showAdvanced: !prev.showAdvanced}))}>
                        {advancedFilters.showAdvanced ? 'Hide' : 'Show'} Advanced Filters
                    </button>
                </div>

                <div className="filter-grid">
                    <div className="filter-group">
                        <label>Search</label>
                        <input 
                            type="text" 
                            placeholder="Serial, model, or device ID..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <label>Status</label>
                        <select 
                            value={filters.status} 
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="assigned">Assigned</option>
                            <option value="unassigned">Unassigned</option>
                        </select>
                    </div>
                </div>

                {advancedFilters.showAdvanced && (
                    <div className="advanced-filters">
                        <div className="filter-grid">
                            <div className="filter-group">
                                <label>Model</label>
                                <select 
                                    value={filters.model} 
                                    onChange={(e) => handleFilterChange('model', e.target.value)}
                                >
                                    <option value="all">All Models</option>
                                    {uniqueModels.map(model => (
                                        <option key={model} value={model}>{model}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Purchase Source</label>
                                <select 
                                    value={filters.purchaseSource} 
                                    onChange={(e) => handleFilterChange('purchaseSource', e.target.value)}
                                >
                                    <option value="all">All Sources</option>
                                    <option value="MANUALLY_ADDED">Manually Added</option>
                                    <option value="RESELLER">Reseller</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Color</label>
                                <select 
                                    value={filters.color} 
                                    onChange={(e) => handleFilterChange('color', e.target.value)}
                                >
                                    <option value="all">All Colors</option>
                                    {uniqueColors.map(color => (
                                        <option key={color} value={color}>{color}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="devices-grid">
                {filteredDevices.map(device => (
                    <div key={device.id} className="device-card">
                        <div className="device-header">
                            <div className="device-model">
                                {device.attributes?.deviceModel || 'Unknown Model'}
                            </div>
                            <div className="status-indicator">
                                <div className={`status-dot ${device.attributes?.status?.toLowerCase()}`}></div>
                                <span className={`status-badge status-${device.attributes?.status?.toLowerCase()}`}>
                                    {device.attributes?.status || 'Unknown'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="device-info">
                            <div className="info-item">
                                <div className="info-label">Serial Number</div>
                                <div className="info-value">{device.attributes?.serialNumber || 'N/A'}</div>
                            </div>
                            <div className="info-item">
                                <div className="info-label">Device ID</div>
                                <div className="info-value">{device.id.substring(0, 12)}...</div>
                            </div>
                            <div className="info-item">
                                <div className="info-label">Purchase Source</div>
                                <div className="info-value">{device.attributes?.purchaseSourceType || 'N/A'}</div>
                            </div>
                            <div className="info-item">
                                <div className="info-label">
                                    {device.attributes?.status === 'ASSIGNED' ? 'Assignment' : 'Color'}
                                </div>
                                <div className="info-value">
                                    {device.attributes?.status === 'ASSIGNED' 
                                        ? getAssignedServerName(device)
                                        : (device.attributes?.color || 'N/A')
                                    }
                                </div>
                            </div>
                        </div>

                        <div className="device-actions">
                            <a 
                                href={`/frontend/device-details.html?customer=${customerId}&device=${device.id}`}
                                className="btn btn-primary"
                            >
                                View Details
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            {filteredDevices.length === 0 && (
                <div style={{textAlign: 'center', padding: '3rem', color: '#6b7280'}}>
                    <p>No devices found matching your filters.</p>
                    <button className="btn btn-secondary" onClick={() => quickFilter('reset')} style={{marginTop: '1rem'}}>
                        Clear All Filters
                    </button>
                </div>
            )}

            {/* MDM Server Detail Modal */}
            {showMdmDetail && selectedMdmServer && (
                <div className="mdm-detail-modal" onClick={() => setShowMdmDetail(false)}>
                    <div className="mdm-detail-content" onClick={(e) => e.stopPropagation()}>
                        <div className="mdm-detail-header">
                            <h2 style={{margin: 0}}>
                                {selectedMdmServer.attributes?.serverName || selectedMdmServer.attributes?.name || selectedMdmServer.id}
                            </h2>
                            <p style={{margin: '0.5rem 0 0 0', opacity: 0.9}}>
                                {selectedMdmServer.attributes?.organizationName || 'MDM Server Management'}
                            </p>
                        </div>
                        <div className="mdm-detail_body">
                            <div className="device-sections">
                                <div className="device-section">
                                    <h4>
                                        Devices Assigned to this Server ({assignedToServer.length})
                                        <span style={{fontSize: '0.875rem', fontWeight: 'normal', color: '#6b7280', marginLeft: '0.5rem'}}>
                                            Currently managed by this server
                                        </span>
                                    </h4>
                                    
                                    <div className="device-search">
                                        <input
                                            type="text"
                                            placeholder="Search assigned devices by serial number, model, or device ID..."
                                            value={assignedDeviceSearch}
                                            onChange={(e) => setAssignedDeviceSearch(e.target.value)}
                                        />
                                        {assignedDeviceSearch && (
                                            <div className="device-search-results">
                                                Showing {filteredAssignedDevices.length} of {assignedToServer.length} assigned devices
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="device-list">
                                        {filteredAssignedDevices.length > 0 ? (
                                            filteredAssignedDevices.map(device => (
                                                <div key={device.id} className="device-item">
                                                    <div className="device-item-info">
                                                        <div className="device-item-name">
                                                            {device.attributes?.deviceModel || 'Unknown Model'}
                                                        </div>
                                                        <div className="device-item-serial">
                                                            Serial: {device.attributes?.serialNumber || 'N/A'}
                                                        </div>
                                                        <div className="device-item-serial">
                                                            ID: {device.id.substring(0, 16)}...
                                                        </div>
                                                    </div>
                                                    <div className="status-indicator">
                                                        <div className="status-dot assigned"></div>
                                                        <span style={{fontSize: '0.75rem', color: '#10b981'}}>ASSIGNED</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : assignedDeviceSearch ? (
                                            <p style={{color: '#6b7280', textAlign: 'center', padding: '2rem'}}>
                                                No assigned devices match your search criteria.
                                            </p>
                                        ) : (
                                            <p style={{color: '#6b7280', textAlign: 'center', padding: '2rem'}}>
                                                No devices currently assigned to this server.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="device-section">
                                    <h4>
                                        Unassigned Devices ({unassignedDevices.length})
                                        <span style={{fontSize: '0.875rem', fontWeight: 'normal', color: '#6b7280', marginLeft: '0.5rem'}}>
                                            Available for assignment
                                        </span>
                                    </h4>
                                    
                                    <div className="device-search">
                                        <input
                                            type="text"
                                            placeholder="Search unassigned devices by serial number, model, or device ID..."
                                            value={unassignedDeviceSearch}
                                            onChange={(e) => setUnassignedDeviceSearch(e.target.value)}
                                        />
                                        {unassignedDeviceSearch && (
                                            <div className="device-search-results">
                                                Showing {filteredUnassignedDevices.length} of {unassignedDevices.length} unassigned devices
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="device-list">
                                        {filteredUnassignedDevices.length > 0 ? (
                                            filteredUnassignedDevices.map(device => (
                                                <div key={device.id} className={`device-item ${selectedDevices.has(device.id) ? 'selected' : ''}`} onClick={() => toggleDeviceSelection(device.id)}>
                                                    <input 
                                                        type="checkbox" 
                                                        className="device-checkbox"
                                                        checked={selectedDevices.has(device.id)}
                                                        onChange={() => toggleDeviceSelection(device.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    <div className="device-item-info">
                                                        <div className="device-item-name">
                                                            {device.attributes?.deviceModel || 'Unknown Model'}
                                                        </div>
                                                        <div className="device-item-serial">
                                                            Serial: {device.attributes?.serialNumber || 'N/A'}
                                                        </div>
                                                        <div className="device-item-serial">
                                                            ID: {device.id.substring(0, 16)}...
                                                        </div>
                                                    </div>
                                                    <div className="status-indicator">
                                                        <div className="status-dot unassigned"></div>
                                                        <span style={{fontSize: '0.75rem', color: '#f59e0b'}}>UNASSIGNED</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : unassignedDeviceSearch ? (
                                            <p style={{color: '#6b7280', textAlign: 'center', padding: '2rem'}}>
                                                No unassigned devices match your search criteria.
                                                <br />
                                                <button 
                                                    style={{marginTop: '1rem', background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', textDecoration: 'underline'}}
                                                    onClick={() => setUnassignedDeviceSearch('')}
                                                >
                                                    Clear search
                                                </button>
                                            </p>
                                        ) : (
                                            <p style={{color: '#6b7280', textAlign: 'center', padding: '2rem'}}>
                                                No unassigned devices available.
                                            </p>
                                        )}
                                    </div>
                                    
                                    {filteredUnassignedDevices.length > 0 && (
                                        <div className="bulk-actions">
                                            <button 
                                                className="btn btn-secondary"
                                                onClick={selectAllFilteredUnassigned}
                                            >
                                                {filteredUnassignedDevices.length > 0 && filteredUnassignedDevices.every(d => selectedDevices.has(d.id))
                                                    ? 'Deselect All Filtered' 
                                                    : 'Select All Filtered'}
                                            </button>
                                            <button 
                                                className="btn assign-btn"
                                                onClick={assignSelectedDevices}
                                                disabled={selectedDevices.size === 0}
                                            >
                                                Assign Selected ({selectedDevices.size})
                                            </button>
                                            <span className="selected-count">
                                                {selectedDevices.size} selected
                                                {unassignedDeviceSearch && ` (${filteredUnassignedDevices.length} filtered)`}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{marginTop: '2rem', textAlign: 'center'}}>
                                <button 
                                    className="btn back-btn"
                                    onClick={() => setShowMdmDetail(false)}
                                >
                                    Back to Device Overview
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(<DeviceManagement />);
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<DeviceManagement />);
