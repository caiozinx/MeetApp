import Meetup from '../models/Meetup';
import * as Yup from 'yup';
import { isBefore, parseISO } from 'date-fns';

class MeetupController {
  async index(req, res) {
    const meetup = await Meetup.findAll({
      where: { user_id: req.userId },
      order: ['date'],
    });

    return res.json(meetup);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string()
        .required()
        .min(4),
      description: Yup.string()
        .required()
        .min(50),
      locate: Yup.string().required(),
      banner: Yup.string().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed.' });
    }

    /**
     * Check if date is before today
     */

    const dateNow = new Date();

    if (isBefore(dateNow, req.date)) {
      return res.status(400).json({ error: "Date can't be bofere" });
    }

    const meetup = await Meetup.create({
      user_id: req.userId,
      title: req.body.title,
      description: req.body.description,
      locate: req.body.locate,
      banner: req.body.banner,
      date: req.body.date,
    });

    res.json({
      meetup,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number().required(),
      title: Yup.string().required(),
      description: Yup.string()
        .min(50)
        .required(),
      locate: Yup.string().required(),
      banner: Yup.string().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed.' });
    }

    const { date, id } = req.body;

    const dateNow = new Date();

    /**
     * Check if date is before.
     */
    if (isBefore(parseISO(date), dateNow)) {
      return res.status(400).json({ error: "Date can't be before." });
    }

    /**
     * Check is owner.
     */
    const meetup = await Meetup.findByPk(id);

    if (req.userId !== meetup.user_id) {
      return res
        .status(400)
        .json({ error: 'You can only change meetups your own.' });
    }

    const resMeetup = await meetup.update(req.body);

    return res.json(resMeetup);
  }

  async delete(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed.' });
    }

    const { id } = req.body;

    /**
     * Check is owner.
     */
    const meetup = await Meetup.findByPk(id);

    if (req.userId !== meetup.user_id) {
      return res
        .status(400)
        .json({ error: 'You can only delete meetups your own.' });
    }

    const dateNow = new Date();

    /**
     * Check not happen
     */
    if (isBefore(parseISO(meetup.date), dateNow)) {
      return res.status(400).json({
        error: "You can only delete meetups haven't passed yet. ",
      });
    }

    await Meetup.destroy({
      where: {
        id: id,
      },
    });

    return res.json({ message: 'Meetup deleted.' });
  }
}

export default new MeetupController();
