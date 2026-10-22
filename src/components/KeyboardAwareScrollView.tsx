// A ScrollView that keeps the focused text field visible: it shrinks above the
// keyboard (unless the screen already wraps it in a KeyboardAvoidingView — pass
// avoid={false}) and scrolls the field into view when the keyboard opens.
import React, { useRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, ScrollViewProps } from 'react-native';
import { useKeyboardScrollIntoView } from '../hooks/useKeyboardScrollIntoView';

interface Props extends ScrollViewProps {
  avoid?: boolean;
}

export function KeyboardAwareScrollView({ avoid = true, children, ...props }: Props) {
  const ref = useRef<ScrollView>(null);
  const onScroll = useKeyboardScrollIntoView(ref, (y) => ref.current?.scrollTo({ y, animated: true }));

  const scroll = (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      scrollEventThrottle={16}
      {...props}
      ref={ref}
      onScroll={onScroll}
    >
      {children}
    </ScrollView>
  );

  if (!avoid) return scroll;
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {scroll}
    </KeyboardAvoidingView>
  );
}
