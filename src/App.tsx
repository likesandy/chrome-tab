import React, { useMemo, useState } from 'react';
import { X, ArrowLeft, ArrowRight, RotateCw, Plus, Star } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { restrictToHorizontalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import './Tabs.less';

const IncognitoIcon = ({ size = 16, className = "", style = {} }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M22 10.5 20.88 3.12a1 1 0 0 0-1.04-.84l-7.7 1-7.7-1a1 1 0 0 0-1.04.84L2 10.5M2 10.5h20M9 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-6 0h-6" />
  </svg>
);

const SortableChromeTab = ({ el, isActive, nextIsActive, isLastInGroup, hideSeparator, remove, setActive }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: el.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.2 : 1,
    '--group-color': el.color,
  } as React.CSSProperties;

  return (
    <div 
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`chrome-tab-wrapper ${isActive ? 'is-active' : ''} ${nextIsActive ? 'next-is-active' : ''} ${isLastInGroup && !nextIsActive ? 'last-in-group' : ''} ${isDragging ? 'is-dragging' : ''}`} 
      style={style}
    >
      <div
        className={`chrome-tab ${isActive ? 'active' : ''} ${el.type === 'grouped-tab' ? 'is-grouped' : ''}`}
        onPointerDown={(e) => {
          // We use onPointerDown instead of onClick to ensure dnd-kit doesn't swallow the click entirely if it's a drag
          // but dnd-kit prevents onClick naturally. We can set active tab immediately.
          setActive(el.id);
        }}
      >
        <div className="connector-line" />
        <div className="content">
          <div className="icon-box">
            <IncognitoIcon />
          </div>
          <span className="title">{el.title}</span>
        </div>

        <div
          className="close-btn"
          onPointerDown={(e) => { e.stopPropagation(); }}
          onClick={(e) => { e.stopPropagation(); remove(el.type === 'normal-tab' ? 'normal' : 'group', el.parentGroupId, el.id); }}
        >
          <X size={14} strokeWidth={2} />
        </div>
      </div>
      {!hideSeparator && <div className="separator" />}
    </div>
  );
}

const SortableChromePill = ({ el, toggleGroup }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: el.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.2 : 1,
    '--group-color': el.color,
  } as React.CSSProperties;

  if (el.isDraggingGroup) {
    return (
      <div ref={setNodeRef} style={{ ...style, display: 'flex', alignItems: 'flex-end', flex: '0 0 auto' }}>
        <div className={`chrome-pill-wrapper ${!el.isExpanded ? 'collapsed' : ''}`} style={{ '--group-color': el.color } as React.CSSProperties}>
          <div
            className="chrome-pill"
            {...attributes}
            {...listeners}
            onClick={() => toggleGroup(el.id)}
          >
            {el.title && <span className="pill-title">{el.title}</span>}
          </div>
          <div className="connector-line" />
        </div>
        {el.isExpanded && el.tabs && el.tabs.map((tab: any) => (
          <div key={tab.id} className="chrome-tab-wrapper grouped" style={{ width: '200px', flex: '0 0 auto', '--group-color': el.color } as React.CSSProperties}>
            <div className="chrome-tab">
              <div className="connector-line" />
              <div className="content">
                <div className="icon-box"><IncognitoIcon /></div>
                <span className="title">{tab.title}</span>
              </div>
              <div className="close-btn"><X size={14} strokeWidth={2} /></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`chrome-pill-wrapper ${!el.isExpanded ? 'collapsed' : ''} ${isDragging ? 'is-dragging' : ''}`}
      style={style}
    >
      <div className="chrome-pill" onClick={() => toggleGroup(el.id)}>
        {el.title && <span className="pill-title">{el.title}</span>}
      </div>
      <div className="connector-line" />
    </div>
  );
};

export default function App() {
  const [activeTabId, setActiveTabId] = useState('yellow-1');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    yellow: true,
    purple: true
  });
  const [tabCounter, setTabCounter] = useState(1);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const [items, setItems] = useState<any[]>([
    {
      type: 'group',
      id: 'yellow',
      color: '#fbbc04',
      title: '',
      tabs: [
        { id: 'yellow-1', title: '新的无痕式标签页' },
        { id: 'yellow-2', title: '新的无痕式标签页' }
      ]
    },
    {
      type: 'group',
      id: 'purple',
      color: '#c58af9',
      title: '生活及购物',
      tabs: [
        { id: 'purple-1', title: '新的无痕式标签页' },
      ]
    }
  ]);

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

  const removeTab = (type: string, groupId: string | null, targetTabId: string) => {
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
      }).filter(item => item.type === 'normal' || item.tabs.length > 0));
    }
  };

  const activeDragType = activeDragId ? items.find(i => i.id === activeDragId)?.type : null;
  const isDraggingPillContainer = activeDragId && activeDragType === 'group';

  const flatItemsForRender = useMemo(() => {
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
        const isGroupDragged = activeDragId === item.id;

        if (isGroupDragged) {
          elements.push({
            type: 'group-pill',
            id: item.id,
            title: item.title,
            color: item.color,
            isExpanded: isExpanded,
            isDraggingGroup: true,
            tabs: item.tabs
          });
        } else {
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
      }
    });
    return elements;
  }, [items, expandedGroups, activeDragId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (over && active.id !== over.id) {
      const activeItem = flatItemsForRender.find(i => i.id === active.id);
      const overItem = flatItemsForRender.find(i => i.id === over.id);

      if (!activeItem || !overItem) return;

      // NEW: Restriction - Grouped tabs can only be sorted within their own group
      if (activeItem.type === 'grouped-tab') {
        const overGroupId = overItem.type === 'group-pill' ? overItem.id : overItem.parentGroupId;
        if (activeItem.parentGroupId !== overGroupId) {
          return; // Exit early, preventing the move
        }
      }

      const oldIndex = flatItemsForRender.findIndex(i => i.id === active.id);
      const newIndex = flatItemsForRender.findIndex(i => i.id === over.id);

      const newFlatItems = arrayMove(flatItemsForRender, oldIndex, newIndex);

      const newItems: any[] = [];
      const processedGroups = new Set<string>();

      newFlatItems.forEach((item: any) => {
        if (item.type === 'normal-tab') {
          // Normal tabs always stay top-level
          newItems.push({ type: 'normal', id: item.id, title: item.title });
        } else if (item.type === 'group-pill' || item.type === 'grouped-tab') {
          const groupId = item.type === 'group-pill' ? item.id : item.parentGroupId;

          if (!processedGroups.has(groupId)) {
            processedGroups.add(groupId);
            const originalGroup = items.find(g => g.id === groupId);

            if (originalGroup) {
              // Find all tabs that currently belong to this group in the flat list
              const internalTabs = newFlatItems.filter((f: any) => f.parentGroupId === groupId);

              if (internalTabs.length > 0) {
                // Refresh internal order based on drag result
                newItems.push({
                  ...originalGroup,
                  tabs: internalTabs.map((t: any) => ({ id: t.id, title: t.title }))
                });
              } else {
                // If group is collapsed, tabs aren't in flat list, keep original internal order
                newItems.push(originalGroup);
              }
            }
          }
        }
      });

      setItems(newItems);
    }
  };

  const activeElement = flatItemsForRender.find(el => el.id === activeDragId);

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: { opacity: '0.4' }
      }
    }),
  };

  return (
    <div className="chrome-ui-container">
      <div className="chrome-window">
        {/* TABS BAR */}
        <div className="chrome-tabs-bar">
          <div className="flex items-center gap-2 px-2 pb-[12px] shrink-0" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '12px', paddingLeft: '8px', paddingRight: '12px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f56' }}></div>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }}></div>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27c93f' }}></div>
          </div>

          <div className="chrome-tabs-scroll-area" style={{ display: 'flex', alignItems: 'flex-end', flex: '1 1 auto', overflow: 'hidden', height: '100%', minWidth: 0 }}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToHorizontalAxis]}
            >
              <SortableContext
                items={flatItemsForRender.map(i => i.id)}
                strategy={horizontalListSortingStrategy}
              >
                {flatItemsForRender.map((el, i) => {
                  const isTab = el.type === 'normal-tab' || el.type === 'grouped-tab';
                  const isActive = activeTabId === el.id;
                  const nextEl = flatItemsForRender[i + 1];
                  const nextIsActive = nextEl && nextEl.id === activeTabId;

                  if (el.type === 'group-pill') {
                    return <SortableChromePill key={el.id} el={el} toggleGroup={toggleGroup} />;
                  }

                  if (isTab) {
                    const isLastElement = i === flatItemsForRender.length - 1;
                    const nextIsPill = nextEl && nextEl.type === 'group-pill';
                    const hideSeparator = isActive || nextIsActive || isLastElement || nextIsPill;
                    const isLastInGroup = el.type === 'grouped-tab' && (nextEl?.type !== 'grouped-tab' || nextEl?.parentGroupId !== el.parentGroupId);

                    return (
                      <SortableChromeTab
                        key={el.id}
                        el={el}
                        isActive={isActive}
                        nextIsActive={nextIsActive}
                        isLastInGroup={isLastInGroup}
                        hideSeparator={hideSeparator}
                        remove={removeTab}
                        setActive={setActiveTabId}
                      />
                    );
                  }
                  return null;
                })}
              </SortableContext>

              <DragOverlay dropAnimation={dropAnimation}>
                {activeElement ? (
                  activeElement.type === 'group-pill' ? (
                    <div className="chrome-drag-overlay-group" style={{ display: 'flex', alignItems: 'flex-end', flex: '0 0 auto', height: '100%', pointerEvents: 'none' }}>
                      <div className={`chrome-pill-wrapper is-dragging-overlay ${!activeElement.isExpanded ? 'collapsed' : ''}`} style={{ '--group-color': activeElement.color } as React.CSSProperties}>
                        <div className="chrome-pill">
                          {activeElement.title && <span className="pill-title">{activeElement.title}</span>}
                        </div>
                        <div className="connector-line" />
                      </div>
                      {activeElement.isDraggingGroup && activeElement.isExpanded && activeElement.tabs && activeElement.tabs.map((tab: any) => (
                        <div key={tab.id} className="chrome-tab-wrapper grouped" style={{ width: '200px', flex: '0 0 auto', '--group-color': activeElement.color } as React.CSSProperties}>
                          <div className={`chrome-tab is-dragging-overlay is-grouped`}>
                            <div className="content">
                              <div className="icon-box"><IncognitoIcon /></div>
                              <span className="title">{tab.title}</span>
                            </div>
                            <div className="close-btn"><X size={14} strokeWidth={2} /></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="chrome-tab-wrapper is-dragging-overlay" style={{ '--group-color': activeElement.color, width: '200px', pointerEvents: 'none' } as React.CSSProperties}>
                      <div className={`chrome-tab active is-dragging-overlay ${activeElement.type === 'grouped-tab' ? 'is-grouped' : ''}`}>
                        <div className="connector-line" />
                        <div className="content">
                          <div className="icon-box"><IncognitoIcon /></div>
                          <span className="title">{activeElement.title}</span>
                        </div>
                        <div className="close-btn" style={{ opacity: 1 }}><X size={14} strokeWidth={2} /></div>
                      </div>
                    </div>
                  )
                ) : null}
              </DragOverlay>

            </DndContext>
          </div>

          <div className="new-tab-btn" onClick={addNormalTab} style={{ flexShrink: 0 }}>
            <Plus size={18} strokeWidth={2} />
          </div>

        </div>

      </div>
    </div>
  );
}
