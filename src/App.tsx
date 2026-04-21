import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, ArrowLeft, ArrowRight, RotateCw, Plus, Star } from 'lucide-react';
import './Tabs.less';

const IncognitoIcon = ({ size = 16, className = "" }) => (
  // Simple incognito icon using an SVG path that matches Chrome
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 10.5 20.88 3.12a1 1 0 0 0-1.04-.84l-7.7 1-7.7-1a1 1 0 0 0-1.04.84L2 10.5M2 10.5h20M9 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-6 0h-6" />
  </svg>
);

export default function App() {
  const [activeTabId, setActiveTabId] = useState('yellow-1');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    yellow: true,
    purple: true
  });
  const [tabCounter, setTabCounter] = useState(1);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Mixed items representing either groups or normal independent tabs
  const [items, setItems] = useState<any[]>([
    {
      type: 'group',
      id: 'yellow',
      color: '#fbbc04',
      title: '', // Empty means just a dot
      tabs: [
        { id: 'yellow-1', title: '新的无痕式标签页' },
        { id: 'yellow-2', title: '新的无痕式标签页' }
      ]
    },
    {
      type: 'group',
      id: 'purple',
      color: '#c58af9',
      title: '生活及购物', // Has text
      tabs: [
        { id: 'purple-1', title: '新的无痕式标签页' },
      ]
    }
  ]);

  useEffect(() => {
    // Scroll active tab into view whenever selected or added
    if (scrollAreaRef.current) {
      const activeEl = scrollAreaRef.current.querySelector('.chrome-tab-wrapper.is-active');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [activeTabId, items]);

  const onWheelScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollAreaRef.current) {
      if (e.deltaY !== 0 && e.deltaX === 0) {
        scrollAreaRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  const addNormalTab = () => {
    const newId = `normal-${tabCounter}`;
    setTabCounter(c => c + 1);
    
    const newTab = {
      type: 'normal',
      id: newId,
      title: '新的无痕式标签页'
    };
    
    setItems([...items, newTab]);
    setActiveTabId(newId);
  };

  const removeTab = (e: React.MouseEvent, type: string, groupId: string | null, targetTabId: string) => {
    e.stopPropagation();
    
    if (type === 'normal') {
      setItems(items.filter(item => item.id !== targetTabId));
    } else if (type === 'group' && groupId) {
      setItems(items.map(item => {
        if (item.id === groupId) {
          return {
            ...item,
            tabs: item.tabs.filter((t: any) => t.id !== targetTabId)
          };
        }
        return item;
      }).filter(item => item.type === 'normal' || item.tabs.length > 0)); // Remove empty groups
    }
  };

  const removeGroup = (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    setItems(items.filter(item => item.id !== groupId));
  };

  const renderElements = useMemo(() => {
    const elements: any[] = [];
    items.forEach((item) => {
      if (item.type === 'normal') {
        elements.push({
          type: 'normal-tab',
          id: item.id,
          title: item.title,
          color: 'transparent',
          parentGroupId: null,
        });
      } else if (item.type === 'group') {
        const isExpanded = expandedGroups[item.id];
        elements.push({
          type: 'group-pill',
          id: item.id,
          title: item.title,
          color: item.color,
          isExpanded: isExpanded
        });
        if (isExpanded) {
          item.tabs.forEach((tab: any) => {
            elements.push({
              type: 'grouped-tab',
              id: tab.id,
              title: tab.title,
              color: item.color,
              parentGroupId: item.id,
            });
          });
        }
      }
    });
    return elements;
  }, [items, expandedGroups]);

  return (
    <div className="chrome-ui-container">
      <div className="chrome-window">
        {/* TABS BAR (Dark Mode Incognito) */}
        <div className="chrome-tabs-bar">
          
          {/* Mac OS Window Buttons for Context */}
          <div className="flex items-center gap-2 px-2 pb-[12px] shrink-0" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '12px', paddingLeft: '8px', paddingRight: '12px' }}>
             <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f56' }}></div>
             <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }}></div>
             <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27c93f' }}></div>
          </div>

          <div 
            className="chrome-tabs-scroll-area" 
            ref={scrollAreaRef}
            onWheel={onWheelScroll}
            style={{ 
              display: 'flex', 
              alignItems: 'flex-end', 
              flex: '1 1 auto', 
              overflowX: 'auto', 
              height: '100%',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {renderElements.map((el, i) => {
              const isTab = el.type === 'normal-tab' || el.type === 'grouped-tab';
              const isActive = activeTabId === el.id;
              const nextEl = renderElements[i + 1];
              const nextIsActive = nextEl && nextEl.id === activeTabId;
              
              if (el.type === 'group-pill') {
                return (
                  <div key={`pill-${el.id}`} className={`chrome-pill-wrapper ${!el.isExpanded ? 'collapsed' : ''}`} style={{ '--group-color': el.color } as React.CSSProperties}>
                    <div className="chrome-pill" onClick={() => toggleGroup(el.id)}>
                      {el.title && <span className="pill-title">{el.title}</span>}
                    </div>
                    <div className="connector-line" />
                  </div>
                );
              }

              if (isTab) {
                const isLastElement = i === renderElements.length - 1;
                const nextIsPill = nextEl && nextEl.type === 'group-pill';
                const hideSeparator = isActive || nextIsActive || isLastElement || nextIsPill;
                const isLastInGroup = el.type === 'grouped-tab' && (nextEl?.type !== 'grouped-tab' || nextEl?.parentGroupId !== el.parentGroupId);

                return (
                  <div key={`tab-${el.id}`} className={`chrome-tab-wrapper ${isActive ? 'is-active' : ''} ${nextIsActive ? 'next-is-active' : ''} ${isLastInGroup || isLastElement ? 'last-in-group' : ''}`} style={{ '--group-color': el.color } as React.CSSProperties}>
                    <div 
                      className={`chrome-tab ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveTabId(el.id)}
                    >
                      <div className="connector-line" />
                      
                      <div className="content">
                        <div className="icon-box">
                          <IncognitoIcon />
                        </div>
                        <span className="title">{el.title}</span>
                      </div>
                      
                      <div className="close-btn" onClick={(e) => removeTab(e, el.type === 'normal-tab' ? 'normal' : 'group', el.parentGroupId, el.id)}>
                        <X size={14} strokeWidth={2} />
                      </div>
                    </div>
                    {/* The small | separator between inactive tabs */}
                    {!hideSeparator && <div className="separator" />}
                  </div>
                );
              }
              return null;
            })}
          </div>

          {/* NEW TAB BUTTON */}
          <div className="new-tab-btn" onClick={addNormalTab} style={{ flexShrink: 0 }}>
            <Plus size={18} strokeWidth={2} />
          </div>

        </div>

        {/* TOOLBAR */}
        <div className="chrome-toolbar">
          <div style={{ display: 'flex', gap: '16px', padding: '0 8px', color: '#9aa0a6' }}>
            <ArrowLeft size={16} strokeWidth={2} />
            <ArrowRight size={16} strokeWidth={2} style={{ opacity: 0.4 }} />
            <RotateCw size={16} strokeWidth={2} />
          </div>

          <div className="omnibox">
            <IncognitoIcon size={14} className="mr-3" style={{ marginRight: '12px', opacity: 0.7 }} />
            <span style={{ opacity: 0.7 }}>Search Google or type a URL</span>
            <Star size={16} style={{ marginLeft: 'auto', opacity: 0.7 }} />
          </div>

          <div style={{ display: 'flex', gap: '16px', padding: '0 8px', color: '#9aa0a6', alignItems: 'center' }}>
            {/* Extensions / Settings Mock */}
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#9aa0a6', opacity: 0.5 }}></div>
            <div style={{ width: '4px', height: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ width: '4px', height: '4px', backgroundColor: '#9aa0a6', borderRadius: '50%' }}></div>
              <div style={{ width: '4px', height: '4px', backgroundColor: '#9aa0a6', borderRadius: '50%' }}></div>
              <div style={{ width: '4px', height: '4px', backgroundColor: '#9aa0a6', borderRadius: '50%' }}></div>
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="chrome-content">
          <IncognitoIcon size={64} className="incognito-large" />
          <h1>You've gone incognito</h1>
          <p>Now you can browse privately, and other people who use this device won't see your activity.</p>
        </div>

      </div>
    </div>
  );
}
