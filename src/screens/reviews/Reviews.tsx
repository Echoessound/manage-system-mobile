/**
 * 酒店评论页面
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MainStackScreenProps } from '../../navigation/types';
import { getHotelReviews, createReview, deleteReview, Review } from '../../api';
import { useAuth } from '../../hooks';

type Props = MainStackScreenProps<'Reviews'>;

// 评分选项
const RATING_OPTIONS = [
  { value: 5, label: '5分', color: '#FFD700' },
  { value: 4, label: '4分', color: '#FFA500' },
  { value: 3, label: '3分', color: '#87CEEB' },
  { value: 2, label: '2分', color: '#FF6347' },
  { value: 1, label: '1分', color: '#FF4500' },
];

// 评论类型选项
const REVIEW_TYPE_OPTIONS = [
  { value: 'good', label: '好评', color: '#52C41A' },
  { value: 'neutral', label: '中评', color: '#FAAD14' },
  { value: 'bad', label: '差评', color: '#FF4D4F' },
];

const ReviewsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { hotelId, hotelName } = route.params;
  const { isLoggedIn, user } = useAuth();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [ratingStats, setRatingStats] = useState({
    total: 0,
    five: 0,
    four: 0,
    three: 0,
    two: 0,
    one: 0,
    good: 0,
    neutral: 0,
    bad: 0,
    avgRating: 0,
  });
  
  // 发布评论状态
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentRating, setCommentRating] = useState(5);
  const [commentType, setCommentType] = useState<'good' | 'neutral' | 'bad'>('good');
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async (reset: boolean = false) => {
    const currentPage = reset ? 1 : page;
    
    if (loading && !reset) return;
    
    try {
      const response = await getHotelReviews(hotelId, currentPage, 10);
      
      if (response.code === 200 && response.data) {
        const newReviews = reset 
          ? response.data.items 
          : [...reviews, ...response.data.items];
        
        setReviews(newReviews);
        // 合并 API 返回的统计数据与默认值，确保所有属性都存在
        setRatingStats({
          ...{
            total: 0,
            five: 0,
            four: 0,
            three: 0,
            two: 0,
            one: 0,
            good: 0,
            neutral: 0,
            bad: 0,
            avgRating: 0,
          },
          ...response.data.ratingStats,
        });
        setHasMore(currentPage < response.data.totalPages);
        setPage(currentPage);
      }
    } catch (error) {
      console.error('获取评论失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hotelId, page, reviews, loading]);

  useEffect(() => {
    fetchReviews(true);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReviews(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
      fetchReviews();
    }
  };

  const handleSubmitReview = async () => {
    if (!isLoggedIn) {
      Alert.alert('提示', '请先登录后再发表评论', [
        { text: '取消', style: 'cancel' },
        { text: '去登录', onPress: () => navigation.navigate('MainTabs') },
      ]);
      return;
    }

    if (!commentContent.trim()) {
      Alert.alert('提示', '请输入评论内容');
      return;
    }

    setSubmitting(true);
    try {
      console.log('Submitting review:', { hotelId, rating: commentRating, content: commentContent.trim(), type: commentType });
      const response = await createReview({
        hotelId,
        rating: commentRating,
        content: commentContent.trim(),
        type: commentType,
      });

      console.log('Review response:', response);
      if (response.code === 200) {
        Alert.alert('成功', '评论发表成功');
        setShowCommentForm(false);
        setCommentContent('');
        setCommentRating(5);
        setCommentType('good');
        fetchReviews(true);
      } else {
        Alert.alert('失败', response.message || '评论发表失败');
      }
    } catch (error: any) {
      console.error('Submit review error:', error);
      Alert.alert('错误', error?.response?.data?.message || '评论发表失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = (reviewId: string) => {
    Alert.alert('确认删除', '确定要删除这条评论吗？', [
      { text: '取消', style: 'cancel' },
      { 
        text: '删除', 
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await deleteReview(reviewId);
            if (response.code === 200) {
              setReviews(prev => prev.filter(r => r._id !== reviewId));
              fetchReviews(true);
            } else {
              Alert.alert('失败', response.message || '删除失败');
            }
          } catch (error) {
            Alert.alert('错误', '删除失败，请稍后重试');
          }
        }
      },
    ]);
  };

  const renderRatingBar = (count: number, total: number, color: string) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <View style={styles.ratingBarContainer}>
        <View style={[styles.ratingBar, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
    );
  };

  const renderReviewItem = ({ item }: { item: Review }) => {
    // user.id 来自登录时返回的用户信息
    const isOwnReview = user?.id === item.userId;
    
    return (
      <View style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewUserInfo}>
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons name="person" size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.reviewUserName}>{item.userName}</Text>
              <Text style={styles.reviewDate}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <View style={styles.reviewRating}>
            {Array.from({ length: 5 }, (_, i) => (
              <MaterialIcons 
                key={i} 
                name="star" 
                size={14} 
                color={i < item.rating ? '#FFD700' : '#ddd'} 
              />
            ))}
          </View>
        </View>
        
        <View style={styles.reviewTypeTag}>
          <Text style={[
            styles.reviewTypeText,
            item.type === 'good' && styles.reviewTypeGood,
            item.type === 'neutral' && styles.reviewTypeNeutral,
            item.type === 'bad' && styles.reviewTypeBad,
          ]}>
            {item.type === 'good' ? '好评' : item.type === 'neutral' ? '中评' : '差评'}
          </Text>
        </View>
        
        <Text style={styles.reviewContent}>{item.content}</Text>
        
        {isOwnReview && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteReview(item._id)}
          >
            <MaterialIcons name="delete-outline" size={18} color="#FF4D4F" />
            <Text style={styles.deleteButtonText}>删除</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* 评分统计 */}
      <View style={styles.statsContainer}>
        <View style={styles.avgRatingContainer}>
          <Text style={styles.avgRatingText}>{ratingStats.avgRating.toFixed(1)}</Text>
          <Text style={styles.avgRatingLabel}>分</Text>
        </View>
        
        <View style={styles.ratingDetailContainer}>
          {RATING_OPTIONS.map((option) => {
            // 根据评分值获取对应的评论数量
            const count = option.value === 5 ? ratingStats.five : 
                          option.value === 4 ? ratingStats.four : 
                          option.value === 3 ? ratingStats.three : 
                          option.value === 2 ? ratingStats.two : ratingStats.one;
            return (
              <View key={option.value} style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>{option.label}</Text>
                {renderRatingBar(count, ratingStats.total, option.color)}
                <Text style={styles.ratingCount}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>
      
      {/* 总评论数 */}
      <Text style={styles.totalReviews}>共 {ratingStats.total} 条评论</Text>
      
      {/* 发表评论按钮 */}
      <TouchableOpacity 
        style={styles.addReviewButton}
        onPress={() => {
          if (!isLoggedIn) {
            Alert.alert('提示', '请先登录后再发表评论', [
              { text: '取消', style: 'cancel' },
              { text: '去登录', onPress: () => navigation.navigate('MainTabs') },
            ]);
            return;
          }
          setShowCommentForm(true);
        }}
      >
        <MaterialIcons name="edit" size={18} color="#1E90FF" />
        <Text style={styles.addReviewButtonText}>发表评论</Text>
      </TouchableOpacity>
      
      <View style={styles.divider} />
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#1E90FF" />
        <Text style={styles.footerText}>加载中...</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E90FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="edit" size={64} color="#ddd" />
            <Text style={styles.emptyText}>暂无评论</Text>
            <Text style={styles.emptySubText}>成为第一个评论的人吧！</Text>
          </View>
        }
      />
      
      {/* 评论表单 Modal */}
      <Modal
        visible={showCommentForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCommentForm(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>发表评价</Text>
              <TouchableOpacity onPress={() => setShowCommentForm(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {/* 评分选择 */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>评分</Text>
                <View style={styles.ratingOptions}>
                  {RATING_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.ratingOption,
                        commentRating === option.value && styles.ratingOptionSelected,
                      ]}
                      onPress={() => setCommentRating(option.value)}
                    >
                      <Text style={[
                        styles.ratingOptionText,
                        commentRating === option.value && styles.ratingOptionTextSelected,
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* 评论类型 */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>类型</Text>
                <View style={styles.typeOptions}>
                  {REVIEW_TYPE_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.typeOption,
                        commentType === option.value && { borderColor: option.color },
                        commentType === option.value && { backgroundColor: option.color + '20' },
                      ]}
                      onPress={() => setCommentType(option.value as 'good' | 'neutral' | 'bad')}
                    >
                      <Text style={[
                        styles.typeOptionText,
                        commentType === option.value && { color: option.color },
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* 评论内容 */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>内容</Text>
                <TextInput
                  style={styles.commentInput}
                  value={commentContent}
                  onChangeText={setCommentContent}
                  placeholder="分享您的入住体验..."
                  placeholderTextColor="#999"
                  multiline
                  maxLength={1000}
                />
                <Text style={styles.charCount}>{commentContent.length}/1000</Text>
              </View>
            </ScrollView>
            
            {/* 提交按钮 */}
            <View style={styles.formButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowCommentForm(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmitReview}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>提交</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 16,
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avgRatingContainer: {
    alignItems: 'center',
    marginRight: 24,
  },
  avgRatingText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  avgRatingLabel: {
    fontSize: 14,
    color: '#666',
  },
  ratingDetailContainer: {
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingLabel: {
    width: 35,
    fontSize: 12,
    color: '#666',
  },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  ratingBar: {
    height: '100%',
    borderRadius: 4,
  },
  ratingCount: {
    width: 30,
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  totalReviews: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E90FF',
    borderRadius: 8,
  },
  addReviewButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1E90FF',
    fontWeight: '500',
  },
  commentForm: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  commentFormTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  formSection: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  ratingOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  ratingOptionSelected: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  ratingOptionText: {
    fontSize: 14,
    color: '#666',
  },
  ratingOptionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  typeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  typeOption: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#666',
  },
  commentInput: {
    minHeight: 100,
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#666',
  },
  submitButton: {
    flex: 1,
    padding: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#1E90FF',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginTop: 16,
  },
  reviewItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E90FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewTypeTag: {
    marginBottom: 8,
  },
  reviewTypeText: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reviewTypeGood: {
    backgroundColor: '#52C41A20',
    color: '#52C41A',
  },
  reviewTypeNeutral: {
    backgroundColor: '#FAAD1420',
    color: '#FAAD14',
  },
  reviewTypeBad: {
    backgroundColor: '#FF4D4F20',
    color: '#FF4D4F',
  },
  reviewContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#FF4D4F',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
});

export default ReviewsScreen;

