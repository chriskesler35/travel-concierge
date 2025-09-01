import apiClient from './apiClient';
import auth from './auth';
import { supabase } from '@/lib/supabase';

class EntityService {
  constructor(entityName) {
    this.entityName = entityName;
    this.endpoint = `/entities/${entityName.toLowerCase()}`;
    this.tableName = entityName.toLowerCase() + 's'; // Convert Journey -> journeys, Feedback -> feedbacks
  }

  async find(query = {}) {
    try {
      // Use Supabase for data fetching
      let supabaseQuery = supabase.from(this.tableName).select('*');
      
      // Apply filters if provided
      if (query.limit) {
        supabaseQuery = supabaseQuery.limit(query.limit);
      }
      
      if (query.orderBy) {
        const [column, direction] = query.orderBy.split(' ');
        supabaseQuery = supabaseQuery.order(column, { ascending: direction !== 'DESC' && direction !== 'desc' });
      }
      
      // Apply filters
      Object.keys(query).forEach(key => {
        if (key !== 'limit' && key !== 'orderBy') {
          supabaseQuery = supabaseQuery.eq(key, query[key]);
        }
      });
      
      const { data, error } = await supabaseQuery;
      
      if (error) {
        console.error(`Supabase error fetching ${this.entityName}:`, error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching ${this.entityName}:`, error);
      throw error;
    }
  }

  async findOne(id) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(`Supabase error fetching ${this.entityName} by id:`, error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching ${this.entityName} by id:`, error);
      throw error;
    }
  }

  async create(data) {
    try {
      // Add user_id automatically if user is logged in and not already set
      if (!data.user_id) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          data.user_id = user.id;
          data.created_by = user.email;
        }
      }
      
      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single();
      
      if (error) {
        console.error(`Supabase error creating ${this.entityName}:`, error);
        throw error;
      }
      
      return result;
    } catch (error) {
      console.error(`Error creating ${this.entityName}:`, error);
      throw error;
    }
  }

  async update(id, data) {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`Supabase error updating ${this.entityName}:`, error);
        throw error;
      }
      
      return result;
    } catch (error) {
      console.error(`Error updating ${this.entityName}:`, error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Supabase error deleting ${this.entityName}:`, error);
        throw error;
      }
      
      return { success: true };
    } catch (error) {
      console.error(`Error deleting ${this.entityName}:`, error);
      throw error;
    }
  }

  async count(query = {}) {
    try {
      let supabaseQuery = supabase.from(this.tableName).select('*', { count: 'exact', head: true });
      
      // Apply filters
      Object.keys(query).forEach(key => {
        supabaseQuery = supabaseQuery.eq(key, query[key]);
      });
      
      const { count, error } = await supabaseQuery;
      
      if (error) {
        console.error(`Supabase error counting ${this.entityName}:`, error);
        throw error;
      }
      
      return count;
    } catch (error) {
      console.error(`Error counting ${this.entityName}:`, error);
      throw error;
    }
  }
  
  // Additional methods to support existing functionality
  async filter(query = {}, orderBy = null) {
    const findQuery = { ...query };
    if (orderBy) {
      findQuery.orderBy = orderBy;
    }
    return await this.find(findQuery);
  }
  
  async list(orderBy = null) {
    const query = {};
    if (orderBy) {
      query.orderBy = orderBy;
    }
    return await this.find(query);
  }
}

export const Journey = new EntityService('Journey');
export const Feedback = new EntityService('Feedback');
export const DiscountCode = new EntityService('DiscountCode');
export const User = auth;