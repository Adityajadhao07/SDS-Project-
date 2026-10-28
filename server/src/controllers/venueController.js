import { venueService } from '../services/venueService.js';

export class VenueController {
  async listVenues(req, res, next) {
    try {
      const filters = {};
      if (req.query.type) {
        filters.type = req.query.type;
      }
      if (req.query.minCapacity !== undefined) {
        filters.minCapacity = req.query.minCapacity;
      }
      if (req.query.facility) {
        filters.facility = req.query.facility;
      }
      if (req.query.date) {
        filters.date = req.query.date;
      }
      const venues = await venueService.listVenues(filters);
      res.json(venues);
    } catch (err) {
      next(err);
    }
  }

  async getVenue(req, res, next) {
    try {
      const venue = await venueService.getVenue(req.params.id);
      res.json(venue);
    } catch (err) {
      next(err);
    }
  }

  async getAvailability(req, res, next) {
    try {
      const result = await venueService.getAvailability(req.params.id, req.query.date);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getCalendar(req, res, next) {
    try {
      const [year, month] = req.query.month.split('-');
      const result = await venueService.getMonthSummary(req.params.id, year, month);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async createVenue(req, res, next) {
    try {
      const venue = await venueService.createVenue(req.body);
      res.status(201).json(venue);
    } catch (err) {
      next(err);
    }
  }

  async updateVenue(req, res, next) {
    try {
      const venue = await venueService.updateVenue(req.params.id, req.body);
      res.json(venue);
    } catch (err) {
      next(err);
    }
  }
}

export const venueController = new VenueController();
