import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Modal,
  Animated,
  PanResponder,
  type PanResponderInstance,
  View,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

// Defined outside the component so its closures aren't part of the render
// body the compiler analyzes for ref-during-render access — the refs it
// reads are only ever touched from actual touch-event callbacks, never
// synchronously during render, but a nested closure created inline in a
// `useState(() => ...)` initializer gets flagged regardless.
function createDragResponder({
  touchStartY,
  translateY,
  onClose,
}: {
  touchStartY: { current: number };
  translateY: Animated.Value;
  onClose: () => void;
}): PanResponderInstance {
  return PanResponder.create({
    onStartShouldSetPanResponder: (evt) => {
      touchStartY.current = evt.nativeEvent.locationY;
      return false;
    },
    // Only drags starting within the handle/header (top ~96px) claim the
    // gesture, so it doesn't fight taps on buttons/chips further down.
    onMoveShouldSetPanResponder: (_, gesture) => {
      if (touchStartY.current > 96) return false;
      return Math.abs(gesture.dy) > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx);
    },
    onPanResponderMove: (_, gesture) => {
      if (gesture.dy > 0) translateY.setValue(gesture.dy);
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy > 120 || gesture.vy > 0.8) {
        onClose();
        return;
      }
      Animated.spring(translateY, {
        toValue: 0,
        damping: 22,
        stiffness: 260,
        mass: 0.7,
        useNativeDriver: true,
      }).start();
    },
  });
}

/**
 * A drag-to-dismiss sheet that rises only as tall as its content (not the
 * full screen) — replaces the old full-screen `Modal` used for single-field
 * editors. `visible` is watched rather than acted on directly so the close
 * animation can finish before the RN `Modal` actually unmounts.
 */
export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  // Animated.Value instances read directly in JSX (style) must live in
  // state, not a ref — the compiler forbids reading a ref's `.current`
  // during render. Plain layout bookkeeping only ever touched from event
  // callbacks (sheetHeight) stays a `useRef`. `touchStartY` also needs to
  // be mutated from an event callback, but it's captured inside the
  // `createDragResponder` call passed to `useState`'s lazy initializer —
  // the compiler flags *any* `useRef` reachable from that call, even
  // though nothing actually derefs it until a real touch event fires. A
  // plain mutable object via `useState` (never touched via its setter)
  // isn't a tracked ref, so it sidesteps the false positive.
  const [translateY] = useState(() => new Animated.Value(windowHeight));
  const [backdropOpacity] = useState(() => new Animated.Value(0));
  const sheetHeight = useRef(windowHeight);
  const [touchStartY] = useState(() => ({ current: 0 }));

  useEffect(() => {
    // Exit-animation bridge: `visible` going false must keep the sheet
    // mounted for the ~200ms slide-down before it actually unmounts, which
    // render alone can't express — this is the standard exception to
    // "don't setState in an effect" for unmount animations.
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      return;
    }
    if (!mounted) return;
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(translateY, {
        toValue: sheetHeight.current,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setMounted(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!mounted) return;
    translateY.setValue(sheetHeight.current || windowHeight);
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 22,
        stiffness: 260,
        mass: 0.7,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const [panResponder] = useState(() =>
    createDragResponder({ touchStartY, translateY, onClose }),
  );

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Animated.View
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: backdropOpacity }}
        >
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }} onPress={onClose} />
        </Animated.View>

        <Animated.View
          {...panResponder.panHandlers}
          onLayout={(e) => {
            sheetHeight.current = e.nativeEvent.layout.height;
          }}
          style={{ transform: [{ translateY }] }}
          className="rounded-t-card border-t border-border-strong bg-background"
        >
          <View className="items-center py-4">
            <View className="h-1 w-10 rounded-full" style={{ backgroundColor: Colors.borderStrong }} />
          </View>
          <View style={{ paddingBottom: insets.bottom + 16 }} className="px-5 pt-2">
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
