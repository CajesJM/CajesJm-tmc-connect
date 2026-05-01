import React from 'react'
import {
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'

interface ConfirmDialogProps {
  visible: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  confirmDestructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmDestructive = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <TouchableWithoutFeedback>
            <View
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 16,
                padding: 24,
                width: '100%',
                maxWidth: 360,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 24,
                elevation: 12,
              }}
            >
              {/* Title */}
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: 8,
                }}
              >
                {title}
              </Text>

              {/* Message */}
              <Text
                style={{
                  fontSize: 14,
                  color: '#6b7280',
                  lineHeight: 22,
                  marginBottom: 24,
                }}
              >
                {message}
              </Text>

              {/* Buttons */}
              <View
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  justifyContent: 'flex-end',
                }}
              >
                <TouchableOpacity
                  onPress={onCancel}
                  style={{
                    paddingVertical: 9,
                    paddingHorizontal: 18,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: '#374151',
                    }}
                  >
                    {cancelLabel}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onConfirm}
                  style={{
                    paddingVertical: 9,
                    paddingHorizontal: 18,
                    borderRadius: 8,
                    backgroundColor: confirmDestructive ? '#dc2626' : '#2563eb',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: '#ffffff',
                    }}
                  >
                    {confirmLabel}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}
