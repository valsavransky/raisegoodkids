// A drag-to-reorder list: each row gets a dotted grip you press and drag. The
// row you're holding is drawn as a lifted copy that follows your finger; the
// real row stays in the list, invisible, as the slot it will drop into, and
// the other rows slide out of the way as you pass them. onReorder is called
// with the new order of keys once the row has settled. Written with
// PanResponder, Animated and LayoutAnimation only (no native gesture
// library), so it ships as an ordinary update. Rows can be different heights;
// they're measured as they lay out.
import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, PanResponder, LayoutAnimation, Platform, UIManager, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const GAP = 8;
const DEFAULT_HEIGHT = 54;

function GripDots() {
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.gripDot} />
      ))}
    </>
  );
}

interface GripProps {
  label: string;
  onStart: () => void;
  onMove: (dy: number) => void;
  onEnd: () => void;
}

function Grip({ label, onStart, onMove, onEnd }: GripProps) {
  const callbacks = useRef({ onStart, onMove, onEnd });
  callbacks.current = { onStart, onMove, onEnd };
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Once the grip is held, the surrounding ScrollView doesn't get it.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => callbacks.current.onStart(),
      onPanResponderMove: (_, g) => callbacks.current.onMove(g.dy),
      onPanResponderRelease: () => callbacks.current.onEnd(),
      onPanResponderTerminate: () => callbacks.current.onEnd(),
    })
  ).current;

  return (
    <View
      {...responder.panHandlers}
      accessibilityRole="adjustable"
      accessibilityLabel={`Drag to reorder ${label}`}
      style={styles.grip}
    >
      <GripDots />
    </View>
  );
}

interface Props<T> {
  items: T[];
  keyOf: (item: T) => string;
  labelOf: (item: T) => string;
  /** Renders one row; put `grip` wherever the handle should sit. */
  renderItem: (item: T, grip: React.ReactNode, state: { isDragging: boolean }) => React.ReactNode;
  onReorder: (orderedKeys: string[]) => void;
  /** Lets the screen turn its ScrollView off while a row is being dragged. */
  onDragStateChange?: (dragging: boolean) => void;
}

export function DraggableList<T>({ items, keyOf, labelOf, renderItem, onReorder, onDragStateChange }: Props<T>) {
  const propKeys = items.map(keyOf);
  const sig = propKeys.join('|');
  const [order, setOrder] = useState(propKeys);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const heights = useRef<Record<string, number>>({});
  const dragTop = useRef(new Animated.Value(0)).current;
  const drag = useRef({ key: '', from: 0, to: 0, startTop: 0, origOrder: [] as string[], ending: false });

  // The order shown: the local, mid-drag order, unless the items themselves
  // changed (one added or removed), in which case the new props win.
  const shown =
    order.length === propKeys.length && propKeys.every((k) => order.includes(k)) ? order : propKeys;
  const shownRef = useRef(shown);
  shownRef.current = shown;

  useEffect(() => {
    if (!drag.current.key) setOrder(propKeys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const itemByKey = new Map(items.map((item) => [keyOf(item), item]));
  const heightOf = (key: string) => heights.current[key] ?? DEFAULT_HEIGHT;
  const topOf = (list: string[], index: number) =>
    list.slice(0, index).reduce((sum, k) => sum + heightOf(k) + GAP, 0);

  const start = (key: string) => {
    const origOrder = [...shownRef.current];
    const from = origOrder.indexOf(key);
    drag.current = { key, from, to: from, startTop: topOf(origOrder, from), origOrder, ending: false };
    dragTop.setValue(drag.current.startTop);
    setDraggingKey(key);
    onDragStateChange?.(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const move = (dy: number) => {
    const d = drag.current;
    if (!d.key || d.ending) return;
    const height = heightOf(d.key);
    const total = topOf(d.origOrder, d.origOrder.length) - GAP;
    const top = Math.max(0, Math.min(Math.max(0, total - height), d.startTop + dy));
    dragTop.setValue(top);
    const center = top + height / 2;
    let to = 0;
    d.origOrder.forEach((k, j) => {
      if (j !== d.from && topOf(d.origOrder, j) + heightOf(k) / 2 < center) to += 1;
    });
    if (to !== d.to) {
      d.to = to;
      const next = d.origOrder.filter((k) => k !== d.key);
      next.splice(to, 0, d.key);
      LayoutAnimation.configureNext({ duration: 150, update: { type: LayoutAnimation.Types.easeInEaseOut } });
      shownRef.current = next;
      setOrder(next);
      Haptics.selectionAsync();
    }
  };

  const end = () => {
    const d = drag.current;
    if (!d.key || d.ending) return;
    d.ending = true;
    // Settle the lifted copy onto its slot, then hand the real row back.
    const finalOrder = shownRef.current;
    const target = topOf(finalOrder, finalOrder.indexOf(d.key));
    Animated.timing(dragTop, { toValue: target, duration: 120, useNativeDriver: true }).start(() => {
      const changed = d.to !== d.from;
      drag.current = { key: '', from: 0, to: 0, startTop: 0, origOrder: [], ending: false };
      setDraggingKey(null);
      onDragStateChange?.(false);
      if (changed) onReorder(finalOrder);
    });
  };

  const draggedItem = draggingKey ? itemByKey.get(draggingKey) : undefined;

  return (
    <View>
      {shown.map((key, index) => {
        const item = itemByKey.get(key);
        if (!item) return null;
        const isHeld = key === draggingKey;
        return (
          <View
            key={key}
            onLayout={(e) => {
              heights.current[key] = e.nativeEvent.layout.height;
            }}
            style={{ marginBottom: index < shown.length - 1 ? GAP : 0, opacity: isHeld ? 0 : 1 }}
          >
            {renderItem(
              item,
              shown.length > 1 ? (
                <Grip label={labelOf(item)} onStart={() => start(key)} onMove={move} onEnd={end} />
              ) : (
                <View style={styles.grip} />
              ),
              { isDragging: false }
            )}
          </View>
        );
      })}
      {draggedItem && (
        <Animated.View
          pointerEvents="none"
          style={[styles.overlay, { transform: [{ translateY: dragTop }, { scale: 1.02 }] }]}
        >
          {renderItem(
            draggedItem,
            <View style={styles.grip}>
              <GripDots />
            </View>,
            { isDragging: true }
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grip: {
    width: 30,
    height: 38,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    justifyContent: 'center',
    columnGap: 4,
    rowGap: 3,
    paddingHorizontal: 8,
  },
  gripDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#B9B3A2' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
});
